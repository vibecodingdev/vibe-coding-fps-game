#!/bin/bash

echo "🧹 清理开发缓存和重启服务器..."

# 停止当前运行的开发服务器
echo "停止当前开发服务器..."
pkill -f "webpack serve" 2>/dev/null || true
pkill -f "webpack-dev-server" 2>/dev/null || true

# 清理webpack缓存
echo "清理webpack缓存..."
rm -rf node_modules/.cache
rm -rf .cache
rm -rf dist

# 清理npm缓存
echo "清理npm缓存..."
npm cache clean --force

# 清理yarn缓存（如果使用yarn）
echo "清理yarn缓存..."
yarn cache clean 2>/dev/null || true

# 重新安装依赖（可选）
echo "是否要重新安装依赖？ (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "重新安装依赖..."
    rm -rf node_modules
    npm install
fi

# 重启开发服务器
echo "启动开发服务器..."
npm run dev

echo "✅ 缓存清理完成，开发服务器已重启！" 