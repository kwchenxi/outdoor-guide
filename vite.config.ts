import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isCompatMode = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'remove-module-type',
          writeBundle() {
            if (isCompatMode) {
              // 构建完成后修改 HTML 文件
              const htmlPath = path.resolve(__dirname, 'dist/index.html');
              if (fs.existsSync(htmlPath)) {
                let html = fs.readFileSync(htmlPath, 'utf-8');
                // 移除 script 标签的 type="module" 属性
                html = html.replace(
                  /<script\s+([^>]*?)type\s*=\s*["']module["']/gi,
                  '<script $1'
                );
                fs.writeFileSync(htmlPath, html);
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
        target: isCompatMode ? 'es2015' : 'esnext', // 兼容模式使用 ES2015
        polyfillDynamicImport: isCompatMode, // 兼容模式下转换动态导入
        minify: 'terser', // 使用 terser 提高兼容性
        cssCodeSplit: false, // 不分割 CSS，减少请求
        rollupOptions: {
          output: {
            format: 'iife', // 使用立即执行函数表达式格式，兼容性更好
            manualChunks: undefined, // 不分割代码，减少请求数量
            entryFileNames: 'assets/[name].js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name].[ext]'
          }
        }
      }
    };
});
