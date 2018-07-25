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
    let id, nextElements
    let marginClasses = ''
    let paddingClasses = ''
    let style = {}

    id = nextElements = elements
    
    if (typeof elements == 'object' && !Array.isArray(elements)) {
      const mt = elements.marginTop === undefined ? '0' : elements.marginTop
      const mb = elements.marginBottom === undefined ? '0' : elements.marginBottom
      const ml = elements.marginLeft === undefined ? '0' : elements.marginLeft
      const mr = elements.marginRight === undefined ? '0' : elements.marginRight
      const pt = elements.paddingTop === undefined ? '0' : elements.paddingTop
      const pb = elements.paddingBottom === undefined ? '0' : elements.paddingBottom
      const pl = elements.paddingLeft === undefined ? '0' : elements.paddingLeft
      const pr = elements.paddingRight === undefined ? '0' : elements.paddingRight

      style = { backgroundColor: elements.backgroundColor }
      marginClasses = " mt" + mt + " mb" + mb + " ml" + ml + " mr" + mr
      paddingClasses = " pt" + pt + " pb" + pb + " pl" + pl + " pr" + pr
      nextElements = elements.children
      id = elements.id
    }

    if (typeof id === 'string') {
      if (id === '__children__') {
        return children
      }

      return (
        <div className={(isRow ? '' : className) + marginClasses + paddingClasses} style={style}>
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
