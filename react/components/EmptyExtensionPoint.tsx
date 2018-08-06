import PropTypes from 'prop-types'
import React, { Component, Fragment } from 'react'
import { graphql } from 'react-apollo'
import AvailableComponents from '../queries/AvailableComponents.graphql'
import { RenderContextProps } from './RenderContext'

interface EmptyExtensionPointProps {
  id: string
  availableComponents: any
  runtime: RenderContext
}

interface EmptyExtensionPointState {
  modalOpen: boolean
  componentSearch: string
}

class EmptyExtensionPoint extends Component<EmptyExtensionPointProps & RenderContextProps, EmptyExtensionPointState> {
  public static propTypes = {
    availableComponents: PropTypes.object,
    id: PropTypes.string
  }

  constructor(props: any) {
    super(props)

    this.state = {
      componentSearch: '',
      modalOpen: false
    }
  }

  public openModal = () => {
    this.setState((prevState) => {
      return ({ ...prevState, modalOpen: true })
    })
  }

  public componentSearch = (event: any) => {
    const componentSearch = event.target.value
    this.setState((prevState) => {
      return ({ ...prevState, componentSearch })
    })
  }

  public closeModal = () => {
    this.setState({ componentSearch: '', modalOpen: false })
  }

  public handleSelectComponent = (event: any) => {
    const { id, availableComponents, runtime: { page, updateExtension, updateComponentAssets } } = this.props
    const treePath = [page, id].join('/')

    const allComponents = availableComponents.availableComponents
      .reduce((acc: any, component: any) => {
        acc[component.name] = {
          assets: component.assets,
          dependencies: component.dependencies
        }
        return acc
      }, {})

    updateComponentAssets(allComponents)
    updateExtension(treePath, { component: event.target.id, shouldRender: true })

    this.closeModal()
  }

  public render() {
    const { availableComponents: { availableComponents } } = this.props
    const { componentSearch } = this.state
    const componentArray = availableComponents
      ? availableComponents.map((component: any) => component.name)
      : []

    const componentsList = componentArray
      .filter((component: string) => {
        return component.toLowerCase().indexOf(componentSearch.toLowerCase()) >= 0
      })
      .map((component: string) => {
        return (
          <div className="w-third h-50 pa3">
            <div className="w-100 h-100 h5 pa4">
              <div
                id={component}
                className="br3 bg-light-silver w-100 h-100 pointer"
                onClick={this.handleSelectComponent}>
              </div>
            </div>
            <div className="pl4 w-100 overflow-x-hidden">
              <span className="f5 mid-gray w-100">{component}</span>
            </div>
          </div>
        )
      })

    return (
      <Fragment>
        <div className="flex flex-grow-1 min-h-100">
          <div
            className="flex items-center justify-center w-100 min-h-100 ba b--silver b--dashed pa6-ns pa6 blue tc bg-light-silver"
            onClick={this.openModal}
          >
            <div className="fw7 pt2">
              Add Component
            </div>
          </div>
        </div>
        <div
          className={`${this.state.modalOpen ? 'fixed absolute--fill shadow-2 flex align-center justify-center z-9999 pr11' : 'dn'}`}
          onClick={this.closeModal}>
          <div
            className="flex flex-column bg-white shadow-2 w-50 h-75 self-center pa8 overflow-y-hidden"
            onClick={(e) => { e.stopPropagation() }}>
            <div className="w-100 bb b--light-gray near-black pb4">
              <span className="f5 fw5 near-black w-100">Components</span>
            </div>
            <div className="w-100 pv6">
              <input
                type="text"
                className="w-100 pv4 ph5 br2 ba bw1 b--light-gray"
                placeholder="Search for a component..."
                onChange={this.componentSearch} />
            </div>
            <div className="w-100 h-100 flex flex-row flex-wrap overflow-y-scroll">
              {componentsList}
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}

export default graphql(AvailableComponents, {
  name: 'availableComponents',
  options: (props: EmptyExtensionPointProps & RenderContextProps) => ({
    variables: {
      extensionName: [props.runtime.page, props.id].join('/'),
      production: false,
      renderMajor: 7,
    },
  }),
}
)(EmptyExtensionPoint)
