import DefaultTheme from 'vitepress/theme'
import { onMounted, onUnmounted } from 'vue'

// 这些笔记是 public/notes 下的独立静态页面（非 VitePress 路由）。
// VitePress 是 SPA，会拦截同域链接做客户端路由，导致点击 notes 链接时
// 找不到对应页面数据而显示 404（手动刷新则因直接向服务器请求静态文件而正常）。
// 这里在捕获阶段拦截这类链接，强制整页跳转，绕过客户端路由。
export default {
  extends: DefaultTheme,
  setup() {
    const handler = (e: MouseEvent) => {
      // 保留修饰键：Ctrl/⌘+点击、中键等仍走浏览器默认（新标签打开）
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const raw = a.getAttribute('href') || ''
      const path = raw.split('#')[0].split('?')[0]
      if (raw.includes('/notes/') && path.endsWith('.html')) {
        e.preventDefault()
        e.stopPropagation()
        window.location.assign(a.href)
      }
    }
    onMounted(() => document.addEventListener('click', handler, true))
    onUnmounted(() => document.removeEventListener('click', handler, true))
  }
}
