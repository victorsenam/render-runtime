import React, {Component} from 'react'
import {canUseDOM} from 'exenv'
import {graphql} from 'react-apollo'
import AuthQuery from './Auth.graphql'

const getPathname = () => {
  return canUseDOM ? window.location.pathname : global.__pathname__
}

class AuthEnsurer extends Component {
  render() {
    if (this.props.data.loading) {
      return
    }

    const {authenticated, redirectTo} = this.props.data.authUser
    if (!authenticated) {
      throw new global.RenderRedirectError(redirectTo)
    }

    return <div>{this.props.children}</div>
  }
}

export default graphql(AuthQuery, {
  options: {
    variables: {
      url: getPathname(),
    },
  },
})(AuthEnsurer)

