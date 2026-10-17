// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Agentic',
  tagline: 'The First AI-Native Programming Language',
  favicon: 'img/favicon.ico',

  url: 'https://agentic-lang.org',
  baseUrl: '/',

  organizationName: 'agentic-lang',
  projectName: 'agentic',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/agentic-lang/agentic/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/agentic-lang/agentic/tree/main/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/agentic-social-card.jpg',
      navbar: {
        title: 'Agentic',
        logo: {
          alt: 'Agentic Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/playground',
            label: 'Playground',
            position: 'left',
          },
          {
            to: '/blog',
            label: 'Blog',
            position: 'left',
          },
          {
            href: 'https://github.com/agentic-lang/agentic',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/tutorials/hello-world',
              },
              {
                label: 'Language Spec',
                to: '/docs/specification',
              },
              {
                label: 'Error Reference',
                to: '/docs/errors',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/agentic',
              },
              {
                label: 'GitHub Discussions',
                href: 'https://github.com/agentic-lang/agentic/discussions',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/agenticLang',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/agentic-lang/agentic',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Agentic Language Project. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer/themes/github'),
        darkTheme: require('prism-react-renderer/themes/dracula'),
        additionalLanguages: ['typescript', 'javascript', 'json'],
      },
      algolia: {
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'agentic-lang',
      },
    }),
};

module.exports = config;
