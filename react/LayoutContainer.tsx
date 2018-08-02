import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import ExtensionPoint from './ExtensionPoint'
import EmptyExtensionPoint from './components/EmptyExtensionPoint'
import { RenderContext } from './components/RenderContext'

type TemplateElement = ElementProps | string | any[]

interface ElementProps {
  id?: string
  style?: StyleProps
  children?: TemplateElement[]
}

interface StyleProps {
  bgColor: string
  horizontalAlign: string
  margin: string[]
  padding: string[]
  verticalAlign: string
}

interface LayoutContainerProps {
  elements: TemplateElement[]
}

interface ContainerProps {
  elements: TemplateElement
  isRow: boolean
  confusion?: number
}

const elementPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired

class Container extends Component<ContainerProps> {
  public static propTypes = {
    elements: elementPropType,
    isRow: PropTypes.bool,
    confusion: PropTypes.number
  }

  public componentDidMount() {
    const element = ReactDOM.findDOMNode(this) as Element
    element.addEventListener('mousemove', this.onMouseMove)
  }

  public onMouseMove(e: any) {
    // handle mouse move
  }

  public render() {
    const { isRow, elements, children, confusion, ...props } = this.props
    const style = elements.style
    const className = `flex flex-grow-1 ${isRow ? 'flex-row' : 'flex-column'}`

    const id = elements.id ? elements.id : elements
    const nextElements = elements.children ? elements.children : elements
    const margin = style && style.margin ? style.margin : ['0', '0', '0', '0']
    const padding = style && style.padding ? style.padding : ['0', '0', '0', '0']
    const bgColor = style && style.backgroundColor ? style.backgroundColor : 'transparent'

    const marginClasses = ' mt' + margin[0] + ' mr' + margin[1] + ' mb' + margin[2] + ' ml' + margin[3]
    const paddingClasses = ' pt' + padding[0] + ' pr' + padding[1] + ' pb' + padding[2] + ' pl' + padding[3]

    if (typeof id === 'string') {
      if (id === '__children__') {
        return children
      }

      return (
        <div
          className={isRow ? marginClasses : (className + paddingClasses)}
          style={{ backgroundColor: bgColor }}>
          <RenderContext.Consumer>
            {runtime => {
              const treePath = [ runtime.page, id ].join('/')
              return runtime.extensions[treePath] === undefined
                ? <EmptyExtensionPoint id={id} {...props} runtime={runtime} />
                : <ExtensionPoint id={id} {...props} />
            }
            }
          </RenderContext.Consumer>
        </div>
      )
    }

    const returnValue: JSX.Element[] = nextElements.map((element: Element, index: number) => {
      return (
        <Container key={index} elements={element} isRow={!isRow} {...props} confusion={
          confusion === undefined ? 0 : (
            isRow ? confusion + 1 : (
              index === nextElements.length - 1 ? confusion : 0
            )
          )
        } >
          {children}
        </Container>
      )
    })

    return (
      <div
        className={className + (isRow ? marginClasses : paddingClasses)}
        style={{ backgroundColor: bgColor }}>
        {returnValue}
      </div>
    )
  }
}

// tslint:disable-next-line
class LayoutContainer extends Component<LayoutContainerProps> {
  public static propTypes = {
    elements: elementPropType
  }

  public render() {
    return <Container {...this.props} isRow={false} />
  }
}

export default LayoutContainer
