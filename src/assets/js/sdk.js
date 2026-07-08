/**
 * sdk.js
 * 子页面通信 SDK，封装与父窗口的 postMessage RPC 调用。
 * 提供简洁的 API，隐藏底层消息传递细节。
 *
 * @version 1.0.0
 * @license MIT
 */
const Shell = (() => {
  // ----- 私有状态 ----------------------------------------------------
  /** 递增消息 ID（若 crypto.randomUUID 不可用） */
  let messageId = 0;

  // 存储待处理的请求
  const pending = {};

  // ----- 工具函数 ----------------------------------------------------

  /**
   * 生成唯一消息 ID
   *
   * @returns {string} 唯一 ID
   */
  function genId() {
    return (crypto.randomUUID && crypto.randomUUID()) || String(++messageId);
  }

  /**
   * 发送命令到父窗口（类似于RPC调用）
   *
   * @param {string} id - 请求 ID
   * @param {string} type - 能力类型
   * @param {*} [data] - 附加数据
   */
  function sendCmd(id, type, data) {
    if (window.parent !== window) {
      window.top.postMessage({id, type, data}, "*");
    } else {
      cleanPending(id);
      console.warn('JS SDK 仅在 iFrame 中有效');
    }
  }

  /**
   * 保存请求信息
   *
   * @param id 请求ID
   * @param pendingItem 请求信息
   */
  function savePending(id, pendingItem) {
    pending[id] = pendingItem;
  }

  /**
   * 清理请求信息
   *
   * @param {string} id - 要清理的 ID
   */
  function cleanPending(id) {
    delete pending[id];
  }

  /**
   * 清理所有指定类型的 请求信息
   * @param {string} type - 能力类型，如 'START_GPS_TRACKING'
   */
  function cleanPendingByType(type) {
    for (const id in pending) {
      if (pending[id] && pending[id].type === type) {
        delete pending[id];
      }
    }
  }

  // ----- 公开 API ----------------------------------------------------

  /**
   * 远程接口：启动 GPS 实时定位（持续追踪）
   * @param {Function} onSuccess - 位置更新回调，接收 GeolocationPosition
   * @param {Function} [onError] - 错误回调，接收错误对象
   * @returns {string} 请求 ID（可用于取消）
   */
  function startGpsTracking(onSuccess, onError) {
    const id = genId();
    const type = 'START_GPS_TRACKING';
    savePending(id, {type, callback: onSuccess, error: onError});
    sendCmd(id, type);
    return id;
  }

  /**
   * 远程接口：停止 GPS 实时定位
   * @param {string} [trackingId] - 可选，指定要停止的追踪 ID
   */
  function stopGpsTracking(trackingId) {
    if (trackingId) {
      cleanPending(trackingId);
    } else {
      cleanPendingByType('START_GPS_TRACKING');
    }
    sendCmd(genId(), 'STOP_GPS_TRACKING');
  }

  /**
   * 打开相机
   * @param {Function} [onSuccess] - 相机打开成功回调
   * @param {Function} [onError] - 相机打开失败回调（可选）
   */
  function openCamera(onSuccess, onError) {
    const id = genId();
    const type = 'OPEN_CAMERA';
    savePending(id, {type, callback: onSuccess, error: onError});
    sendCmd(id, type);
  }

  /**
   * 关闭相机
   * @param {Function} [onSuccess] - 相机关闭成功回调
   * @param {Function} [onError] - 相机关闭失败回调（可选）
   */
  function closeCamera(onSuccess, onError) {
    const id = genId();
    const type = 'CLOSE_CAMERA';
    savePending(id, {type, callback: onSuccess, error: onError});
    sendCmd(id, type);
  }

  // ----- 公共 API 暴露 ----------------------------------------------------
  return {
    pending,
    cleanPending,
    startGpsTracking,
    stopGpsTracking,
    openCamera,
    closeCamera
  }
})()

// ----- 初始化（自动执行） ----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('message', (event) => {
    const result = event.data;
    if (!result || typeof result !== 'object' || !result.id) return;

    const pendingItem = Shell.pending[result.id];
    if (!pendingItem) {
      console.warn(`未找到请求 ID: ${result.id}`);
      return;
    }

    // 根据类型处理响应
    switch (pendingItem.type) {
      case 'START_GPS_TRACKING': {
        if (result.state) {
          pendingItem.callback && pendingItem.callback(result.data);
        } else {
          pendingItem.error && pendingItem.error(result.data);
        }
        break;
      }
      case 'OPEN_CAMERA': {
        // 打开相机：成功保留 pending 等待后续结果，错误则清理并回调
        if (result.state) {
          pendingItem.callback && pendingItem.callback(result.data);
        } else {
          pendingItem.error && pendingItem.error(result.data);
          Shell.cleanPending(result.id);
        }
        break;
      }
      case 'CLOSE_CAMERA': {
        // 关闭相机：无论成功或失败，都清理 pending
        if (result.state) {
          pendingItem.callback && pendingItem.callback(result.data);
        } else {
          pendingItem.error && pendingItem.error(result.data);
        }
        Shell.cleanPending(result.id);
        break;
      }
      case 'CAMERA_RESULT': {
        // 拍照结果：无论成功或失败，都清理 pending
        if (result.state) {
          pendingItem.callback && pendingItem.callback(result.data);
        } else {
          pendingItem.error && pendingItem.error(result.data);
        }
        Shell.cleanPending(result.id);
        break;
      }
    }
  })
  console.log('Shell SDK 初始化完成，开始监听父窗口消息。');
})