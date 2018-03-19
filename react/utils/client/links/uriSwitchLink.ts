import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {visit} from 'graphql'

const versionVisitorExtractor = (versionHolder: any) => {
  return {
    Argument (node: any) {
      if (node.name.value === 'version') {
        versionHolder.version = node.value.value
      }
    }
  }
}

const versionFromQuery = (query: any) => {
  const versionHolder = {version: '0'}
  const versionExtractor = versionVisitorExtractor(versionHolder)
  visit(query, versionExtractor)
  return versionHolder.version
}

const uriFromQuery = (query: any) => `/_v/v${versionFromQuery(query)}/graphql`

export const uriSwitchLink = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const context = operation.getContext()
  const {query} = operation

  operation.setContext({
    ...context,
    uri: uriFromQuery(query)
  })

  return forward ? forward(operation) : null
})

/*
 * This linker middleware is used for changing http verbs
 *
 * If the query type is Query, the request will be made using an HTTP GET
 * If the query type is Mutation, the request will be made using HTTP POST
 */
// export const createHttpSwitchLink = (inputURI) => {
//   return new ApolloLink((operation: Operation, forward: NextLink) => {
//     const {query, variables, operationName} = operation
//     const context = operation.getContext()
//     const {fetchOptions = {}, uri: contextURI} = context
//     const targetUri: any = parse(contextURI || inputURI, true)
//     delete targetUri.search

//     fetchOptions.method = hasMutationField(query) ? 'POST' : 'GET'

//     if(fetchOptions.method === 'GET') {
//       targetUri.query = {
//         ...targetUri.query,
//         operationName,
//         'query': print(query).replace(/\s\s+/g, ' '),
//         variables,
//       }
//     }

//     operation.setContext({
//       ...context,
//       fetchOptions,
//       uri: format(targetUri),
//     })

//     return forward(operation)
//   })
// }
