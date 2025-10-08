// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// GitHub Pages configuration
	site: 'https://siqilu.github.io/notes',
	base: '/notes',
	integrations: [
		starlight({
			title: 'Notes',
			defaultLocale: 'root',
			lastUpdated: true,
			locales: {
				root: {
					label: 'English',
					lang: 'en',
				},
				zh: {
					label: '中文',
					lang: 'zh-CN',
				},
			},
			sidebar: [
				{
					label: 'Home',
					translations: {
						'zh-CN': '首页',
					},
					link: '/'
				},
				{
					label: 'Fixing SSH Agent in Non-Interactive Shells',
					translations: {
						'zh-CN': '修复非交互式 Shell 中的 SSH Agent 访问问题',
					},
					link: '/fixing-ssh-agent-in-non-interactive-shells/'
				},
			],
		}),
		sitemap({
			changefreq: 'weekly',
			priority: 0.8,
		}),
	],
});
