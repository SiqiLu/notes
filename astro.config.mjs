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
				{
					label: '2025 Responsive Device Matrix',
					translations: {
						'zh-CN': '2025 响应式设备矩阵',
					},
					link: '/device-matrix-2025/'
				},
				{
					label: 'Astro Responsive Image Specification',
					translations: {
						'zh-CN': 'Astro 响应式图片方案',
					},
					link: '/astro-responsive-image-specification/'
				},
				{
					label: 'Astro Responsive Image Quick Reference',
					translations: {
						'zh-CN': 'Astro 响应式图片快速参考手册',
					},
					link: '/astro-responsive-image-quick-reference/'
				},
			],
		}),
		sitemap({
			changefreq: 'weekly',
			priority: 0.8,
		}),
	],
});
