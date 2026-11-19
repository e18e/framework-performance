export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  plugins: ['prettier-plugin-astro'],
  overrides: [
    {
      files: 'packages/results/data/**/*.json',
      options: {
        parser: 'json',
        objectWrap: 'collapse',
        printWidth: 100,
      },
    },
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
}
