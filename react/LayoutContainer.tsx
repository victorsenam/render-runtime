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
    const className = `flex flex-grow-1 ${isRow ? 'flex-row' : 'flex-column'}`
    let nextElements = elements
    let marginClasses = ''
    let style = {}

    if (typeof elements == 'object' && !Array.isArray(elements)) {
      const mt = elements.marginTop === undefined ? '' : elements.marginTop
      const mb = elements.marginBottom === undefined ? '' : elements.marginBottom
      const ml = elements.marginLeft === undefined ? '' : elements.marginLeft
      const mr = elements.marginRight === undefined ? '' : elements.marginRight

      style = {
        backgroundColor: elements.backgroundColor,
        padding: elements.padding
      }
      marginClasses = " mt" + mt + " mb" + mb + " ml" + ml + " mr" + mr
      nextElements = elements.children
    }

    if (typeof nextElements === 'string') {
      if (nextElements === '__children__') {
        return children
      }
      return (
        <div className={(isRow ? '' : className) + marginClasses} style={style}>
          <ExtensionPoint id={nextElements} {...props} />
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
      <div className={className + marginClasses} style={style}>
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
