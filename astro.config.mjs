// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sidebar from './sidebar.config.js';

export default defineConfig({
  site: 'https://shane-docs.pages.dev',

  integrations: [
    starlight({
      title: 'Shane Docs',

      customCss: ['./src/styles/custom.css'],

      components: {
        SocialIcons: './src/components/SocialIcons.astro',
      },

      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/shane00413-wq/shane-docs',
        },
        {
          icon: 'astro',
          label: 'Blog',
          href: 'https://shane-blog.pages.dev',
        },
      ],

      // Strict two-folder i18n setup per the Starlight guide
      // (https://starlight.astro.build/zh-cn/guides/i18n/): no "root" locale,
      // every language -- including English -- lives in its own folder under
      // src/content/docs/. So English is src/content/docs/en/, Chinese is
      // src/content/docs/zh-cn/, and every URL is prefixed accordingly
      // (/en/..., /zh-cn/...). Pages with the same filename in both folders
      // are automatically linked as translations of each other by Starlight.
      defaultLocale: 'en',

      locales: {
        en: {
          label: 'English',
        },
        'zh-cn': {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },

      sidebar: [
        {
          label: 'Home',
          translations: {
            'zh-cn': '首页',
          },
          items: [
            {
              label: 'Introduction',
              translations: {
                'zh-cn': '介绍文档',
              },
              // Locale-agnostic slug: Starlight prepends the current
              // locale's prefix automatically, so this resolves to
              // /en/ or /zh-cn/ depending on which language the reader
              // is browsing. Do not hardcode a locale prefix here.
              link: '/',
            },
          ],
        },
        ...sidebar,
      ],
    }),
  ],
});