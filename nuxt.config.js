{
  modules: [
    '@nuxt/content'
  ],
  content: {
    dir: 'content',
    apiPrefix: 'content',
    fullTextSearchFields: [ 'title', 'tags', 'description', 'text', 'slug'],
    liveEdit: true,
    markdown:
  }
}
