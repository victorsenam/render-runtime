import {canUseDOM} from 'exenv'
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'

import {TreePathContext, TreePathProps, withTreePath} from './utils/treePath'

import ExtensionPointComponent from './components/ExtensionPointComponent'
import {RenderContext} from './components/RenderContext'

if (canUseDOM) {
  window.__treePathToSetState__ = window.__treePathToSetState__ || {}
}

interface Props {
  id: string,
  params?: any,
  query?: any,
}

type ExtendedProps = Props & TreePathProps

interface State {
  newTreePath: string
}

class ExtensionPoint extends PureComponent<ExtendedProps, State> {
  public static propTypes = {
    children: PropTypes.node,
    params: PropTypes.object,
    query: PropTypes.object,
    treePath: PropTypes.string.isRequired,
  }

  public static childContextTypes = {
    treePath: PropTypes.string
  }

  private static mountTreePath (currentId: string, parentTreePath: string) {
    return [parentTreePath, currentId].filter(id => !!id).join('/')
  }

  public constructor (props: any) {
    super(props)

    this.state = {
      editProps: null,
    }
  }

  public componentWillMount() {
    this.componentWillReceiveProps(this.props)
  }

  public componentWillReceiveProps(nextProps: ExtendedProps) {
    this.setState({
      newTreePath: ExtensionPoint.mountTreePath(nextProps.id, nextProps.treePath)
    })
  }

  public getChildContext() {
    return { treePath: this.state.newTreePath }
  }

  public setEditProps = (editProps) => {
    this.setState({editProps})
  }

  public render() {
    if (canUseDOM) {
      window.__treePathToSetState__[this.state.newTreePath] = this.setEditProps
    }

    return (
      <RenderContext.Consumer>
        {this.getExtensionPointComponent}
      </RenderContext.Consumer>
    )
  }

  private getExtensionPointComponent = (runtime: RenderContext) => {
    const {newTreePath, editProps} = this.state
    const {children, params, query, id, treePath, ...parentProps} = this.props
    const extension = runtime.extensions[newTreePath]
    const component = extension ? extension.component : null
    const extensionProps = extension ? extension.props : null

    const props = editProps || {
      ...parentProps,
      ...extensionProps,
      params,
      query,
    }

    return (
      <TreePathContext.Provider value={{treePath: newTreePath}}>
        <ExtensionPointComponent component={component} props={props} runtime={runtime} treePath={newTreePath}>{children}</ExtensionPointComponent>
      </TreePathContext.Provider>
    )
  }
}

export default withTreePath(ExtensionPoint)
