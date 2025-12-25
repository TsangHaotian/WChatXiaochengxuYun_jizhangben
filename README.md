# 微信小程序 - 个人记账本

一个基于微信云开发的个人记账小程序，帮助用户记录日常收支情况，管理个人财务。

## 功能特点

- **收支记录**：记录每笔收支明细，支持收入和支出两种类型
- **分类管理**：预设常用收支分类，方便快速选择
- **月度统计**：按月份查看收支情况，清晰了解财务状况
- **数据可视化**：直观展示收支比例，帮助分析消费习惯
- **数据安全**：用户数据云端存储，多端同步，安全可靠

## 技术栈

- **前端**：微信小程序原生框架
- **后端**：微信云开发（云函数 + 云数据库）
- **存储**：云存储

## 项目结构

```
├── cloudfunctions/      # 云函数目录
│   ├── addBook/         # 添加账单
│   ├── deleteBook/      # 删除账单
│   ├── getBookList/     # 获取账单列表
│   ├── getBookType/     # 获取账单类型
│   └── quickstartFunctions/  # 云开发快速启动示例
├── miniprogram/         # 小程序前端代码
│   ├── pages/           # 页面目录
│   │   ├── addBook/     # 添加/编辑账单页
│   │   └── index/       # 首页（账单列表）
│   └── app.js           # 小程序入口文件
├── project.config.json  # 项目配置文件
└── README.md           # 项目说明文档
```

## 页面展示
<img width="400" height="880" alt="正常使用1" src="https://github.com/user-attachments/assets/72cbbe4f-469a-450a-97e9-4dce149fe5ff" />
<img width="400" height="880" alt="正常使用2" src="https://github.com/user-attachments/assets/c768479c-7172-44a0-9ba5-5beeae27b866" />

## 部署详细教程

### 创建云环境
<img width="1252" height="943" alt="0创建云环境" src="https://github.com/user-attachments/assets/55b99c28-c3db-4281-a816-2c475e949436" />

### 修改app.js中的云环境id
<img width="986" height="564" alt="1修改appjd中的云环境id" src="https://github.com/user-attachments/assets/0d9951ad-9624-4b16-80d5-cc2046609956" />

### 选择云环境
<img width="590" height="170" alt="2选择云环境" src="https://github.com/user-attachments/assets/90b8b3b7-c358-4d16-9dca-7e26a04ce5a3" />

### 五个云函数分别上传并部署
<img width="477" height="220" alt="3四个函数分别上传并部署" src="https://github.com/user-attachments/assets/5516ab22-7d2f-4d46-a506-e746ba3aa27a" />

### 上传过程
<img width="1229" height="906" alt="5创建数据库" src="https://github.com/user-attachments/assets/090c1c19-d014-4501-9c64-742918df1949" />

### 创建数据库（数据库名为books）
<img width="1229" height="906" alt="5创建数据库" src="https://github.com/user-attachments/assets/24681ae4-4a87-48f0-b837-ec13586381bc" />

### 部署完毕即可正常使用

##

## 云函数说明

### 1. addBook

**功能**：添加新的账单记录

**参数**：
- `amtType`: 账单类型（0-支出，1-收入）
- `bookAmt`: 金额
- `bookDate`: 日期（日）
- `bookMonth`: 月份
- `bookYear`: 年份
- `week`: 星期
- `remark`: 备注
- `bookTypeName`: 类型名称
- `bookTypeIcon`: 类型图标
- `bookTypeId`: 类型ID

### 2. deleteBook

**功能**：删除指定的账单记录

**参数**：
- `id`: 账单ID

### 3. getBookList

**功能**：获取指定月份的账单列表

**参数**：
- `year`: 年份
- `month`: 月份

**返回**：
- `list`: 账单列表
- `income`: 总收入
- `pay`: 总支出

### 4. getBookType

**功能**：获取账单类型列表

**参数**：
- `type`: 类型（0-支出，1-收入）

## 快速开始

1. **环境准备**
   - 安装微信开发者工具
   - 申请微信小程序 AppID
   - 开通云开发服务

2. **导入项目**
   - 使用微信开发者工具导入本项目
   - 在项目设置中配置 AppID
   - 开启云开发服务

3. **部署云函数**
   - 在 cloudfunctions 目录下，右键每个云函数文件夹，选择"上传并部署"

4. **运行项目**
   - 点击微信开发者工具的"预览"按钮
   - 使用微信扫描二维码即可体验

## 数据库设计

### books 集合

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _openid | String | 用户唯一标识 |
| type | String | 账单类型（income/expense） |
| amount | Number | 金额 |
| bookDate | Number | 日期（日） |
| bookMonth | Number | 月份 |
| bookYear | Number | 年份 |
| week | String | 星期 |
| remark | String | 备注 |
| bookTypeName | String | 类型名称 |
| bookTypeIcon | String | 类型图标 |
| bookTypeId | String | 类型ID |
| createTime | Date | 创建时间 |
| updateTime | Date | 更新时间 |

## 开发指南

1. **页面开发**
   - 使用微信小程序的 WXML + WXSS + JS 进行页面开发
   - 使用云开发 SDK 调用云函数和操作数据库

2. **云函数开发**
   - 在 cloudfunctions 目录下创建新的云函数
   - 使用 `wx-server-sdk` 进行开发
   - 通过 `cloud.database()` 操作数据库

3. **调试**
   - 使用微信开发者工具的云开发控制台查看日志和数据库
   - 使用真机预览功能进行真机调试

## 常见问题

1. **云函数调用失败**
   - 检查云函数是否已部署
   - 检查云函数返回的错误信息
   - 确保云环境已正确初始化

2. **数据库操作失败**
   - 检查集合名称和字段名是否正确
   - 检查数据库权限设置
   - 确保查询条件正确
