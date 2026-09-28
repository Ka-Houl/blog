import { defineConfig } from 'vitepress'

// 站点配置：GitHub 项目页（Ka-Houl/blog），站点地址 https://ka-houl.github.io/blog/
// 若以后把仓库名改为 ka-houl.github.io（用户页），把 base 改回 '/' 即可
export default defineConfig({
  base: '/blog/',
  title: '小虾米的博客',
  description: '个人博客：AI 学习、Git 命令、前端八股文',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '博客', link: '/blog/' },
      { text: 'AI 学习', link: '/ai-learning/' },
      { text: 'Git 命令', link: '/git-commands/' },
      { text: '前端八股文', link: '/frontend-notes/' },
      { text: '关于', link: '/about/' },
    ],
    // 显式侧边栏：新增文章时在此追加对应 link 即可（VitePress 1.x 对按路径 'auto' 支持不完善）
    sidebar: {
      '/blog/': [
        {
          text: '博客',
          items: [
            { text: '文章列表', link: '/blog/' },
            { text: 'Hello World', link: '/blog/hello-world' },
          ],
        },
      ],
      '/ai-learning/': [
        {
          text: 'AI 学习项目',
          items: [
            { text: '概览', link: '/ai-learning/' },
            { text: 'AI 学习概览', link: '/ai-learning/intro' },
          ],
        },
      ],
      '/git-commands/': [
        {
          text: 'Git 命令项目',
          items: [
            { text: '概览', link: '/git-commands/' },
            { text: '常用命令速查', link: '/git-commands/common' },
          ],
        },
      ],
      '/frontend-notes/': [
        {
          text: '前端八股文',
          items: [
            { text: '概览', link: '/frontend-notes/' },
            { text: 'JavaScript 基础', link: '/frontend-notes/js-basics' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Ka-Houl' },
    ],
    search: {
      provider: 'local',
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    outline: {
      label: '本页目录',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
})
