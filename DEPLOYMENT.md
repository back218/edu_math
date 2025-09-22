# 在线部署指南

这个教育管理平台是一个纯前端应用，所有数据都存储在浏览器的localStorage中，无需后端服务即可完整使用。以下是多种在线部署方案，您可以根据自己的需求选择合适的方式。

## 前提条件

在部署前，请确保您已完成以下准备工作：

1. 下载并解压项目代码
2. 确保您的电脑已安装Node.js (建议v16以上版本)
3. 在项目根目录运行以下命令安装依赖并构建项目：

```bash
npm install
npm run build
```

构建成功后，项目根目录会生成`dist`文件夹，其中包含了所有需要部署的静态文件。

## 部署方案一：Netlify部署（推荐）

Netlify是一个提供免费静态网站托管服务的平台，操作简单，提供CDN加速、自动部署等功能，非常适合快速部署前端应用。

### 详细步骤：

#### 前提准备
1. 确保您的项目代码已提交到Git仓库（GitHub、GitLab、Bitbucket等）
2. 确保项目已配置正确的构建命令和输出目录

#### 部署步骤
1. 访问 [Netlify官网](https://www.netlify.com/) 并注册/登录账号
2. 登录后，在Dashboard页面点击"New site from Git"按钮
3. 选择您项目代码所在的Git仓库托管平台（GitHub、GitLab、Bitbucket等）
4. 授权Netlify访问您的仓库
5. 选择您要部署的具体仓库
6. 在部署配置页面，填写以下信息：
   - Branch to deploy: 选择要部署的分支（通常是main或master）
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Environment variables: 如需设置环境变量，点击"Advanced build settings"添加
7. 点击"Deploy site"按钮，等待部署完成
8. 部署成功后，Netlify会为您分配一个随机域名（如：your-site-name.netlify.app）

#### 自定义域名配置
1. 在项目页面，点击"Site settings"进入设置页面
2. 在左侧菜单中选择"Domain management"
3. 点击"Add custom domain"按钮
4. 输入您已购买的域名，然后点击"Verify"
5. 按照Netlify提供的DNS配置指南，在您的域名注册商处添加相应的DNS记录
6. DNS记录生效后，您可以在Netlify中为域名配置HTTPS（Netlify会自动生成免费的SSL证书）

#### 配置自动部署
1. Netlify默认会为您的仓库配置Webhook，当您推送到指定分支时，会自动触发构建和部署
2. 如需调整自动部署设置，在项目页面点击"Site settings"
3. 在左侧菜单中选择"Build & deploy"
4. 在"Continuous Deployment"部分可以调整部署分支、构建命令等设置

#### 配置构建环境
1. 在项目页面点击"Site settings"
2. 在左侧菜单中选择"Build & deploy"
3. 在"Environment"部分点击"Edit variables"可以添加或修改环境变量
4. 在"Build image selection"部分可以选择构建环境的版本

#### 部署注意事项
1. 由于应用使用localStorage存储数据，不同设备或浏览器之间的数据不会同步
2. 对于生产环境部署，建议在Netlify中配置适当的HTTP安全头和CORS设置
3. 可以在Netlify中设置自定义重定向规则，以确保路由正确处理
4. Netlify的免费计划有带宽和构建时间的限制，如果超出限制可能需要升级到付费计划

#### 查看部署日志
1. 在项目页面，点击"Deploys"标签页
2. 您可以看到所有部署记录，点击任意部署记录可以查看详细的构建和部署日志
3. 如果部署失败，可以通过日志排查问题

## 部署方案二：Vercel部署

Vercel是另一个流行的静态网站托管平台，同样提供免费服务，适合前端应用部署。

### 步骤：

1. 访问 [Vercel官网](https://vercel.com/) 并注册/登录账号
2. 点击"New Project"按钮
3. 选择您项目代码所在的Git仓库
4. 在部署配置页面，Vercel会自动识别您的项目类型并配置相应的构建参数
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击"Deploy"按钮，等待部署完成
6. 部署成功后，Vercel会为您分配一个随机域名，您可以在项目设置中自定义域名

## 部署方案三：GitHub Pages部署

如果您的代码托管在GitHub上，可以使用GitHub Pages免费部署静态网站。

### 步骤：

1. 在项目根目录创建一个`gh-pages`分支
2. 安装`gh-pages`包：
   ```bash
   npm install -D gh-pages
   ```
3. 在`package.json`文件中添加以下脚本：
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
4. 构建项目：
   ```bash
   npm run build
   ```
5. 部署到GitHub Pages：
   ```bash
   npm run deploy
   ```
6. 部署成功后，您的网站将可以通过 `https://[用户名].github.io/[仓库名]` 访问

## 部署方案四：自建服务器部署

如果您有自己的服务器，可以将构建后的静态文件部署到服务器上。

### 步骤：

1. 使用FTP、SCP或其他工具将`dist`文件夹中的所有文件上传到您的服务器
2. 确保您的服务器已安装Web服务器软件（如Nginx、Apache等）
3. 配置Web服务器指向您上传的静态文件目录
   - Nginx配置示例：
     ```nginx
     server {
       listen 80;
       server_name your-domain.com;
       root /path/to/your/dist;
       index index.html;
       
       location / {
         try_files $uri $uri/ /index.html;
       }
     }
     ```
4. 重启Web服务器使配置生效
5. 通过您的域名访问部署的应用

## 注意事项

1. 由于应用使用localStorage存储数据，不同设备或浏览器之间的数据不会同步
2. 如果需要多用户数据共享，您可能需要扩展应用以支持后端API和数据库
3. 建议定期备份localStorage中的数据，以防浏览器数据丢失
4. 对于生产环境部署，建议配置HTTPS以确保数据传输安全

## 后续步骤

部署完成后，您可以：
- 分享网站链接给需要使用的教师或管理员
- 根据实际需求自定义应用的主题和功能
- 考虑添加用户认证和数据同步功能（需要后端支持）
- 参考项目根目录下的`GIT_GUIDE.md`文件了解如何简单地上传代码到Git仓库