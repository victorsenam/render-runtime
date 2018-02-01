import Button from '@vtex/styleguide/lib/Button'
import React, {Component} from 'react'
import {graphql} from 'react-apollo'
import Form from 'react-jsonschema-form'
import PropTypes from 'prop-types'

import saveExtensionMutation from './saveExtension.graphql'

class ComponentEditor extends Component {
  static propTypes = {
    extensionName: PropTypes.any,
    saveExtension: PropTypes.any,
  }

  static contextTypes = {
    editExtensionPoint: PropTypes.func,
  }

  constructor(props) {
    super(props)

    this.state = {
      extensionName: props.extensionName,
      extension: global.__RUNTIME__.extensions[props.extensionName],
      oldPropsJSON: JSON.stringify(global.__RUNTIME__.extensions[props.extensionName].props),
    }
  }

  handleFormChange = (event) => {
    console.log('Updating props with formData...', event.formData)
    global.__RUNTIME__.extensions[this.state.extensionName].props = event.formData
    global.__RUNTIME__.eventEmitter.emit(`extension:${this.state.extensionName}:update`)
  }

  handleSave = (event) => {
    console.log('save', event, this.state)
    const {saveExtension} = this.props
    saveExtension({
      variables: {
        extensionName: this.state.extensionName,
        component: this.state.extension.component,
        props: JSON.stringify(this.state.extension.props),
      },
    })
    .then((data) => {
      console.log('OK!', data)
      this.context.editExtensionPoint(null)
    })
    .catch(err => {
      alert('Error saving extension point configuration.')
      console.log(err)
      this.handleCancel()
    })
  }

  handleCancel = () => {
    const oldProps = JSON.parse(this.state.oldPropsJSON)
    console.log('Updating props with old props...', oldProps)
    global.__RUNTIME__.extensions[this.state.extensionName].props = oldProps
    global.__RUNTIME__.eventEmitter.emit(`extension:${this.state.extensionName}:update`)
    this.context.editExtensionPoint(null)
  }

  render() {
    const {extensionName, extension} = this.state
    const component = global.__RENDER_6_COMPONENTS__[extension.component]

    return (
      <div className="mw6 center mv3">
        <h4 className="mt1">
          {extensionName} nhad
        </h4>
        <Form
          schema={component.schema}
          formData={extension.props}
          onChange={this.handleFormChange}
          onSubmit={this.handleSave} />
        <Button htmlProps={{onClick: this.handleCancel}}>
          Cancel
        </Button>
      </div>
    )
  }
}

export default graphql(saveExtensionMutation, {name: 'saveExtension'})(ComponentEditor)
