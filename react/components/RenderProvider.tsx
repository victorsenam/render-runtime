import {canUseDOM} from 'exenv'
import {History, Location, LocationListener, UnregisterCallback} from 'history'
import PropTypes from 'prop-types'
import {parse} from 'qs'
import React, {Component, ReactElement} from 'react'
import {ApolloProvider} from 'react-apollo'
import {Helmet} from 'react-helmet'
import {IntlProvider} from 'react-intl'

import {fetchAssets} from '../utils/assets'
import {getClient} from '../utils/client'
import {loadLocaleData} from '../utils/locales'
import {createLocaleCookie, fetchMessages, fetchMessagesForApp} from '../utils/messages'
import {navigate as pageNavigate, NavigateOptions, pageNameFromPath} from '../utils/pages'
import {fetchRuntime} from '../utils/runtime'

import {NormalizedCacheObject} from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import PageCacheControl from '../utils/cacheControl'
import BuildStatus from './BuildStatus'
import ExtensionPointComponent from './ExtensionPointComponent'
import NestedExtensionPoints from './NestedExtensionPoints'

export const CultureContext = React.createContext()

interface Props {
  children: ReactElement<any> | null
  history: History | null
  cacheControl?: PageCacheControl
  baseURI: string
  root: string
  runtime: RenderRuntime
}

export interface RenderProviderState {
  components: RenderRuntime['components']
  culture: RenderRuntime['culture']
  extensions: RenderRuntime['extensions']
  messages: RenderRuntime['messages']
  page: RenderRuntime['page']
  pages: RenderRuntime['pages']
  production: RenderRuntime['production']
  userMessages: Record<string, string>
  query: RenderRuntime['query']
}

class RenderProvider extends Component<Props, RenderProviderState> {
  public static childContextTypes = {
    account: PropTypes.string,
    components: PropTypes.object,
    culture: PropTypes.object,
    emitter: PropTypes.object,
    extensions: PropTypes.object,
    fetchComponent: PropTypes.func,
    getSettings: PropTypes.func,
    history: PropTypes.object,
    navigate: PropTypes.func,
    onPageChanged: PropTypes.func,
    page: PropTypes.string,
    pages: PropTypes.object,
    prefetchPage: PropTypes.func,
    production: PropTypes.bool,
    updateExtension: PropTypes.func,
    updateRuntime: PropTypes.func,
    workspace: PropTypes.string,
  }

  public static propTypes = {
    children: PropTypes.element,
    history: PropTypes.object,
    root: PropTypes.string,
    runtime: PropTypes.object,
  }

  private rendered!: boolean
  private unlisten!: UnregisterCallback | null
  private apolloClient: ApolloClient<NormalizedCacheObject>

  constructor(props: Props) {
    super(props)
    const {culture, messages, components, extensions, pages, page, query, production} = props.runtime
    const {history, baseURI, cacheControl} = props

    if (history) {
      const renderLocation = {...history.location, state: {renderRouting: true}}
      history.replace(renderLocation)
      // backwards compatibility
      global.browserHistory = history
    }

    this.apolloClient = getClient(props.runtime, baseURI, cacheControl)
    this.state = {
      components,
      culture,
      extensions,
      messages,
      page,
      pages,
      production,
      query,
      userMessages: {},
    }
  }

  public componentDidMount() {
    this.rendered = true
    const {history, runtime} = this.props
    const {production, emitter} = runtime

    this.unlisten = history && history.listen(this.onPageChanged)
    emitter.addListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.addListener('localesUpdated', this.onLocalesUpdated)
      emitter.addListener('extensionsUpdated', this.updateRuntime)
    }
  }

  public componentWillReceiveProps(nextProps: Props) {
    // If RenderProvider is being re-rendered, the global runtime might have changed
    // so we must update the root extension.
    if (this.rendered) {
      this.updateExtension(nextProps.root, nextProps.runtime.extensions[nextProps.root])
    }
  }

  public componentWillUnmount() {
    const {runtime} = this.props
    const {production, emitter} = runtime
    if (this.unlisten) {
      this.unlisten()
    }
    emitter.removeListener('localesChanged', this.onLocaleSelected)

    if (!production) {
      emitter.removeListener('localesUpdated', this.onLocalesUpdated)
      emitter.removeListener('extensionsUpdated', this.updateRuntime)
    }
  }

  public getChildContext() {
    const {history, runtime} = this.props
    const {components, extensions, page, pages, culture} = this.state
    const {account, emitter, settings, production, workspace} = runtime

    return {
      account,
      components,
      culture,
      emitter,
      extensions,
      fetchComponent: this.fetchComponent,
      getSettings: (app: string) => settings[app],
      history,
      navigate: this.navigate,
      onPageChanged: this.onPageChanged,
      page,
      pages,
      prefetchPage: this.prefetchPage,
      production,
      updateExtension: this.updateExtension,
      updateRuntime: this.updateRuntime,
      workspace,
    }
  }

  public navigate = (options: NavigateOptions) => {
    const {history} = this.props
    const {pages} = this.state
    return pageNavigate(history, pages, options)
  }

  public onPageChanged = (location: Location) => {
    const {pages} = this.state
    const {pathname, state} = location

    // Make sure this is our navigation
    if (!state || !state.renderRouting) {
      return
    }

    const page = pageNameFromPath(pathname, pages)

    if (!page) {
      window.location.href = `${location.pathname}${location.search}`
      return
    }

    const query = parse(location.search.substr(1))

    this.setState({
      page,
      query,
    })
  }

  public prefetchPage = (pageName: string) => {
    const {extensions} = this.state
    const component = extensions[pageName].component
    return this.fetchComponent(component)
  }

  public fetchComponent = (component: string) => {
    if (!canUseDOM) {
      throw new Error('Cannot fetch components during server side rendering.')
    }

    const {components, culture: {locale}} = this.state
    const [app] = component.split('/')
    const sameAppAsset = Object.keys(global.__RENDER_7_COMPONENTS__).find((c) => c.startsWith(app))

    if (sameAppAsset) {
      return fetchAssets(components[component])
    }

    const messagesPromise = fetchMessagesForApp(this.apolloClient, app, locale)
    const assetsPromise = fetchAssets(components[component])

    return Promise.all([messagesPromise, assetsPromise]).then(([messages]) => {
      this.setState({
        messages: {
          ...this.state.messages,
          ...messages,
        },
      })
    })
  }

  public onLocalesUpdated = (locales: string[]) => {
    const {runtime: {renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state

    // Current locale is one of the updated ones
    if (locales.indexOf(this.state.culture.locale) !== -1) {
      fetchMessages(this.apolloClient, page, production, locale, renderMajor)
        .then(messages => {
          this.setState({
            messages,
          })
        })
        .catch(e => {
          console.log('Failed to fetch new locale file.')
          console.error(e)
        })
    }
  }

  public onLocaleSelected = (locale: string) => {
    const {runtime: {renderMajor}} = this.props
    const {page, production} = this.state

    if (locale !== this.state.culture.locale) {
      createLocaleCookie(locale)
      Promise.all([
        fetchMessages(this.apolloClient, page, production, locale, renderMajor),
        loadLocaleData(locale),
      ])
      .then(([messages]) => {
        this.setState({
          culture: {
            ...this.state.culture,
            locale,
          },
          messages,
        })
      })
      .then(() => window.postMessage({key: 'cookie.locale', body: {locale}}, '*'))
      .catch(e => {
        console.log('Failed to fetch new locale file.')
        console.error(e)
      })
    }
  }

  public updateRuntime = () => {
    const {runtime: {emitter, renderMajor}} = this.props
    const {page, production, culture: {locale}} = this.state

    return fetchRuntime(this.apolloClient, page, production, locale, renderMajor)
      .then(({components, extensions, messages, pages}) => {
        this.setState({
          components,
          extensions,
          messages,
          pages,
        }, () => emitter.emit('extension:*:update', this.state))
      })
  }

  public updateExtension = (name: string, extension: Extension) => {
    const {runtime: {emitter}} = this.props
    const {extensions} = this.state

    this.setState({
      extensions: {
        ...extensions,
        [name]: extension,
      },
    }, () => emitter.emit(`extension:${name}:update`, this.state))
  }

  public updateUserMessages = (messages: Record<string, string>) => {
    this.setState({
      userMessages: {
        ...this.state.userMessages,
        ...messages,
      }
    })
  }

  public render() {
    const {children, runtime} = this.props
    const {culture, culture: {locale}, messages, pages, page, query, production, extensions} = this.state

    const cultureContext = {
      ...culture,
      updateLocale: this.onLocaleSelected,
      updateUserMessages: this.updateUserMessages
    }

    console.log('cultureContext', cultureContext)

    const component = children
      ? React.cloneElement(children as ReactElement<any>, {query})
      : (
        <div className="render-provider">
          <Helmet title={pages[page] && pages[page].title} />
          {!production && <BuildStatus />}
          <NestedExtensionPoints page={page} query={query} />
        </div>
      )

    const root = page.split('/')[0]
    const editorProvider = extensions[`${root}/__provider`]
    const maybeEditable = !production && editorProvider
      ? <ExtensionPointComponent component={editorProvider.component} props={{extensions, pages, page}}>{component}</ExtensionPointComponent>
      : component

    return (
      <ApolloProvider client={this.apolloClient}>
        <IntlProvider locale={locale} messages={messages}>
          <CultureContext.Provider value={cultureContext}>
            {maybeEditable}
          </CultureContext.Provider>
        </IntlProvider>
      </ApolloProvider>
    )
  }
}

export default RenderProvider
