import PropTypes from 'prop-types'
import React, { Component } from 'react'

import ExtensionPoint from './ExtensionPoint'

type Element = Object | string | any[]

interface LayoutContainerProps {
  elements: Element[]
}

interface ContainerProps {
  elements: Element
  isRow: boolean
}

const elementPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired

class Container extends Component<ContainerProps> {
  public static propTypes = {
    elements: elementPropType,
    isRow: PropTypes.bool
  }

  public render() {
    const { isRow, elements, children, ...props } = this.props
    const style = elements.style
    const className = `flex flex-grow-1 ${isRow ? 'flex-row' : 'flex-column'}`

    const id = elements.id ? elements.id : elements
    const nextElements = elements.children ? elements.children : elements
    const margin = style && style.margin ? style.margin : [ '0', '0', '0', '0' ]
    const padding = style && style.padding ? style.padding : [ '0', '0', '0', '0' ]
    const bgColor = style && style.backgroundColor ? style.backgroundColor : 'transparent'
    
    const marginClasses = " mt" + margin[0] + " mr" + margin[1] + " mb" + margin[2] + " ml" + margin[3]
    const paddingClasses = " pt" + padding[0] + " pr" + padding[1] + " pb" + padding[2] + " pl" + padding[3]

    if (typeof id === 'string') {
      if (id === '__children__') {
        return children
      }

      return (
        <div 
          className={isRow ? marginClasses : (className + paddingClasses)} 
          style={{ backgroundColor: bgColor }}>
          <ExtensionPoint id={id} {...props} />
        </div>
      )
    }

    const returnValue: JSX.Element[] = nextElements.map((element: Element, index: number) => {
      return (
        <Container key={index} elements={element} isRow={!isRow} {...props} >
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
