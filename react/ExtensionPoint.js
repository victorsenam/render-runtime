import React, {Component} from 'react'
import PropTypes from 'prop-types'
import treePath from 'react-tree-path'

const empty = <span className="ExtensionPoint--empty" />

class ExtensionPoint extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
    implementation: PropTypes.func,
    settings: PropTypes.object,
    treePath: PropTypes.string,
  }

  static contextTypes = {
    extensions: PropTypes.object,
    pages: PropTypes.object,
    page: PropTypes.string,
    editExtensionPoint: PropTypes.func,
    editMode: PropTypes.bool,
    production: PropTypes.bool,
  }

  constructor(props, context) {
    super()

    const {treePath} = props

    const {extensions} = context

    this.state = {
      extension: extensions[treePath],
      isEditable: !!(extensions[treePath] && extensions[treePath].props),
    }
  }

  handleEditClick = () => {
    const {editExtensionPoint} = this.context
    editExtensionPoint(this.props.treePath)
  }

  render() {
    const {pages, production, editMode} = this.context
    const {extension} = this.state
    const {children, treePath, ...other} = this.props

    if (!extension) {
      return empty
    }

    const {query} = global.__RUNTIME__

    const params = pages[treePath] && pages[treePath].params
    const {component, props: extensionProps} = extension
    const Component = global.__RENDER_6_COMPONENTS__[component]

    if (!Component) {
      // If extension.component exists, display error: component not found.
      return empty
    }

    const props = {
      params,
      query,
      ...extensionProps,
      ...other,
    }

    const editable = !production && editMode && Component.schema
    const className = editable ? 'relative' : ''
    const onClick = editable ? this.handleEditClick : undefined

    // TODO: ErrorBoundary
    return (
      <div
        className={className}
        onClick={onClick}>
        {editable && <div className="absolute w-100 h-100 bg-blue z-2 br2 o-20 dim pointer"></div>}
        <Component {...props}>{children}</Component>
      </div>
    )
  }

  _handleExtensionPointUpdate = () => {
    const {treePath} = this.props
    const {extensions} = this.context
    this.setState({
      extension: extensions[treePath],
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.treePath !== this.props.treePath) {
      const {treePath} = nextProps
      const {extensions} = this.context
      this.setState({
        extension: extensions[treePath],
      })
    }
  }

  componentDidMount() {
    const {extension} = this.state
    const {treePath} = this.props
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      extension &&
      eventEmitter.addListener(
        `component:${extension.component}:update`,
        this._handleExtensionPointUpdate,
      ).addListener(
        `extension:${treePath}:update`,
        this._handleExtensionPointUpdate,
      ).addListener(
        'extension:*:update',
        this._handleExtensionPointUpdate,
      )
  }

  componentWillUnmount() {
    const {extension} = this.state
    const {treePath} = this.props
    const {production, eventEmitter} = global.__RUNTIME__
    !production &&
      extension &&
      eventEmitter.removeListener(
        `component:${extension.component}:update`,
        this._handleExtensionPointUpdate,
      ).removeListener(
        `extension:${treePath}:update`,
        this._handleExtensionPointUpdate,
      ).removeListener(
        'extension:*:update',
        this._handleExtensionPointUpdate,
      )
  }
}

export default treePath(ExtensionPoint)
