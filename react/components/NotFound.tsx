import * as React from 'react'
import {getComponentFromExtensions} from '../utils/assets'

interface Props {
  useDefault?: boolean
}

export default class NotFound extends React.PureComponent<Props> {
  public render() {
    const Component = getComponentFromExtensions('404')

    if (Component && !this.props.useDefault) {
      return <Component {...this.props} />
    }

    return (
      <div>
        <h2>404 - Não encontramos a página para o caminho que você especificou</h2>
      </div>
    )
  }
}
