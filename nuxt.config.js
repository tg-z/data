export default {
  modules: [,
    '@nuxt/content'
  ],
  generate: {
    async routes () {
      const { $content } = require('@nuxt/content')
      const files = await $content().only(['path']).fetch()

      return files.map(file => file.path === '/index' ? '/' : file.path)
    }
  }
}

