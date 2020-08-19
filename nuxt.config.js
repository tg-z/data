export default {
  content: {
    apiPrefix: 'content',
    dir: 'content',
    fullTextSearchFields: ['title', 'description', 'slug', 'text', 'tags'],
    nestedProperties: [],
    liveEdit: true,
    markdown: {
      remarkPlugins: [
        'remark-squeeze-paragraphs',
        'remark-slug',
        'remark-autolink-headings',
        'remark-external-links',
        'remark-footnotes'
      ],
      rehypePlugins: [
        'rehype-minify-whitespace',
        'rehype-sort-attribute-values',
        'rehype-sort-attributes',
        'rehype-raw'
      ],
      prism: {
        theme: 'prismjs/themes/prism.css'
      }
    },
    yaml: {},
    csv: {},
    xml: {},
    extendParser: {}
  }
}
