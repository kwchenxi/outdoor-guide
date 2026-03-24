import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'inline-all-resources',
          generateBundle(options: any, bundle: any) {
            // 收集所有资源内容
            const assets: Record<string, string> = {};
            
            // 保存所有资源内容
            for (const fileName of Object.keys(bundle)) {
              const chunk = bundle[fileName];
              if (chunk.type === 'asset' && typeof chunk.source === 'string') {
                // CSS 文件
                if (fileName.endsWith('.css')) {
                  assets[fileName] = chunk.source;
                }
              } else if (chunk.type === 'chunk') {
                // JavaScript 文件
                assets[fileName] = chunk.code;
              }
            }
            
            // 修改 HTML，内联所有资源
            this.emitFile({
              type: 'asset',
              fileName: 'index.html',
              source: (bundle['index.html'] as any).source.replace(
                /<script[^>]*src="([^"]*)"[^>]*><\/script>/g,
                (match: string, src: string) => {
                  const fileName = src.replace(/^\//, '');
                  if (assets[fileName]) {
                    return `<script>${assets[fileName]}</script>`;
                  }
                  return match;
                }
              ).replace(
                /<link[^>]*href="([^"]*)"[^>]*rel="stylesheet"[^>]*>/g,
                (match: string, href: string) => {
                  const fileName = href.replace(/^\//, '');
                  if (assets[fileName]) {
                    return `<style>${assets[fileName]}</style>`;
                  }
                  return match;
                }
              )
            });
          },
          writeBundle() {
            // 构建完成后删除外部的资源文件，因为已经内联了
            const distPath = path.resolve(__dirname, 'dist');
            if (fs.existsSync(distPath)) {
              const assetsPath = path.join(distPath, 'assets');
              if (fs.existsSync(assetsPath)) {
                fs.rmSync(assetsPath, { recursive: true, force: true });
              }
            }
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2015', // 兼容旧浏览器
        minify: 'terser',
        cssCodeSplit: false, // 不分割 CSS
        rollupOptions: {
          output: {
            format: 'iife', // 使用立即执行函数表达式格式，兼容性更好
            manualChunks: undefined, // 不分割代码
          }
        }
      }
    };
});