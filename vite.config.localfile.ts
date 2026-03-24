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
          name: 'local-file-friendly',
          writeBundle() {
            // 构建完成后修改 HTML 文件，使其可以直接在文件系统中打开
            const htmlPath = path.resolve(__dirname, 'dist/index.html');
            if (fs.existsSync(htmlPath)) {
              let html = fs.readFileSync(htmlPath, 'utf-8');
              
              // 1. 移除 script 标签的 type="module" 属性
              html = html.replace(
                /<script\s+([^>]*?)type\s*=\s*["']module["']/gi,
                '<script $1'
              );
              
              // 2. 移除 script 和 link 标签的 crossorigin 和 integrity 属性
              // 处理带引号的属性
              html = html.replace(/\s+crossorigin="[^"]*"/gi, '');
              html = html.replace(/\s+integrity="[^"]*"/gi, '');
              // 处理不带引号的属性
              html = html.replace(/\s+crossorigin(?=\s|>)/gi, '');
              html = html.replace(/\s+integrity(?=\s|>)/gi, '');
              
              // 3. 将相对路径转换为绝对路径
              const distPath = path.resolve(__dirname, 'dist');
              html = html.replace(
                /(src|href)="(\/?[^"]*)"/g,
                (match: string, attr: string, src: string) => {
                  // 如果是绝对路径（以/开头），转换为相对于HTML文件的路径
                  if (src.startsWith('/')) {
                    const fileName = src.substring(1); // 去掉开头的 /
                    return `${attr}="${fileName}"`;
                  }
                  return match;
                }
              );
              
              fs.writeFileSync(htmlPath, html);
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
            entryFileNames: 'index.js', // 使用固定名称，方便引用
            chunkFileNames: 'chunk.js',
            assetFileNames: '[name].[ext]'
          }
        },
        // 确保生成的HTML可以处理相对路径
        assetsDir: '.',
        outDir: 'dist',
        emptyOutDir: true
      }
    };
});