/**
 * index.js
 * 主窗口能力代理层：监听 iframe 的 postMessage 请求，调用原生能力并返回结果。
 * 与 capabilities.js 配合，实现安全隔离的父子通信。
 *
 * @version 1.0.0
 * @license MIT
 */

// ----- Tauri Core ---------------------------------------------------
const { invoke } = window.__TAURI__.core;

// ----- 配置 ----------------------------------------------------------
/** 白名单（开发时可用 "*"，生产环境请替换为具体域名） **/
const WHITE_LIST = [location.origin];

// ----- 常量 ----------------------------------------------------------
const RESPONSE_SUCCESS = 1;
const RESPONSE_ERROR = 0;

// ----- DOM 引用 ------------------------------------------------------
const appFrame = document.getElementById('appFrame');
const loadingEl = document.getElementById('loading');
const cameraFrame = document.getElementById('cameraFrame');

// ----- 工具函数 ------------------------------------------------------

/**
 * 安全克隆对象（用于 postMessage 传输）
 * @param {*} obj - 任意可序列化的值
 * @returns {*} 克隆后的对象，若序列化失败则返回 null 并打印错误
 */
function safeClone(obj) {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('克隆对象失败（可能包含循环引用）:', error);
    return null;
  }
}

/**
 * 切换 DOM 元素的 class 样式
 * @param {Element} el - DOM 元素
 * @param {string} className - class 名称
 * @param {boolean} force - 是否强制添加或移除类
 */
function toggleClass(el, className, force) {
  if (el) {
    el.classList.toggle(className, force);
  }
}

/**
 * 读取 Rust 应用配置
 * @returns {Promise<Object>} 配置对象
 */
async function getConfig() {
  const config = await invoke('get_config');
  console.log('Rust 后端配置:', config);
  return config;
}

// ----- 消息处理核心 --------------------------------------------------

/**
 * 发送回复消息给请求方
 * @param {MessageEvent} event - 原始事件对象
 * @param {*} data - 回复数据
 * @param {number} state - RESPONSE_SUCCESS 或 RESPONSE_ERROR
 * @param {string} reqId - 请求携带的 id
 */
function sendReply(event, data, state, reqId) {
  try {
    event.source.postMessage({id: reqId, data, state}, event.origin);
  } catch (error) {
    console.error('回复消息失败:', error);
  }
}

/**
 * 处理来自子页面的消息
 */
function handleMessage(event) {
  // 验证来源：只允许白名单的域名
  const isAllowed = WHITE_LIST.includes("*") || WHITE_LIST.includes(event.origin);
  if (!isAllowed) {
    console.warn('拒绝来自非白名单来源的消息:', event.origin);
    return;
  }

  // 解析消息
  const data = event.data;
  if (!data || typeof data !== 'object') {
    console.warn('收到无效消息:', data);
    return;
  }

  const { type, id } = data;
  if (!type) {
    console.warn('消息缺少 type 字段:', data);
    return;
  }

  // 根据类型调用指令
  try {
    switch (type) {
      case 'START_GPS_TRACKING': {
        $.startGpsTracking((position) => {
          sendReply(event, safeClone(position), RESPONSE_SUCCESS, id);
        }, (error) => {
          // 错误时只发送一次错误报告，但定位会继续重试
          sendReply(event, {code: error.code, message: error.message}, RESPONSE_ERROR, id);
        })
        break;
      }
      case 'STOP_GPS_TRACKING': {
        $.stopGpsTracking();
        sendReply(event, { message: 'GPS is Stopped' }, RESPONSE_SUCCESS, id);
        break;
      }
      case 'OPEN_CAMERA': {
        $.openCamera(() => {
          cameraFrame.dataset.id = id;
          cameraFrame.dataset.origin = event.origin;
          sendReply(event, { message: 'Camera is Opened', type}, RESPONSE_SUCCESS, id);
        });
        break;
      }
      case 'CLOSE_CAMERA': {
        $.closeCamera(() => {
          sendReply(event, { message: 'Camera is Closed' }, RESPONSE_SUCCESS, id);
        });
        break;
      }
      case 'CAMERA_RESULT': {
        // 处理相机拍照结果，转发给业务 appFrame
        const { image } = data;
        if (!image) {
          console.warn('CAMERA_RESULT 缺少 image 数据');
          sendReply(event, { message: '缺少图片数据' }, RESPONSE_ERROR, id);
          return;
        }

        // 保存当前相机回复所需的上下文
        const reqId = cameraFrame.dataset.id;
        if (!reqId) {
          console.warn('CAMERA_RESULT 未找到对应的请求 ID，无法转发给业务 appFrame');
          return;
        }

        // 构造回复事件
        const replyEvent = {
          source: appFrame.contentWindow,
          origin: cameraFrame.dataset.origin,
        };

        // 发送数据给业务 appFrame
        sendReply(replyEvent, {image: data.image, type}, RESPONSE_SUCCESS, reqId);

        // 关闭相机并清理所有痕迹
        $.closeCamera();
        break;
      }
      default: {
        const errMsg = `未知能力类型: ${type}`;
        sendReply(event, { message: errMsg }, RESPONSE_ERROR, id);
        console.warn(errMsg);
      }
    }
  } catch (e) {
    console.error(`处理消息 ${type} 时发生异常:`, e);
    sendReply(event, { message: '内部处理错误' }, RESPONSE_ERROR, id);
  }
}

// ----- Tauri 相关 --------------------------------------------------

/**
 * 初始化应用配置
 */
async function initAppConfig() {
  const config = await getConfig();

  // 设置 iframe 载入地址
  if (typeof config.url === 'string') {
    appFrame.src = config.url;
  }

  // 扩展白名单（以后端配置为主）
  if (config.white_list instanceof Array) {
    WHITE_LIST.push(...config.white_list);
  }
}

// ----- 初始化 --------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('message', handleMessage);
  console.log('index.js 初始化完成，开始监听 postMessage 请求。');
})

appFrame.addEventListener('load', () => {
  toggleClass(loadingEl, 'd-none', true);
})

initAppConfig();