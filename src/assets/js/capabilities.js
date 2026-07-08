/**
 * capabilities.js
 * 为 Tauri 应用提供统一的原生能力封装。
 * 仅应在主窗口 (index.html) 中引入，所有能力通过 postMessage 代理给子页面。
 *
 * 依赖：外部需提供 `cameraFrame`（DOM 元素）和 `toggleClass`（函数）。
 *
 * @version 1.0.0
 * @license MIT
 */
const Capabilities = (() => {
  // ----- GPS 状态变量 ------------------------------------------------
  /** 当前 watch ID */
  let gpsWatchId = null;

  /** 重试计时器 ID */
  let gpsRetryTimer = null;

  /** 重试的时间间隔 **/
  const retryTimeout = 5000;

  /** 是否已主动停止（用于阻止定时器回调误触） */
  let isStopped = true;

  // ----- 相机内部状态 ------------------------------------------------
  let cameraReady = false;   // 标记相机 iframe 是否已加载完成

  /**
   * 启动 GPS 实时定位（持续追踪）
   * 若定位中断，会无限自动重试，直到成功或调用 stopGpsTracking()
   *
   * @param {Function} onSuccess - 位置更新回调，接收 GeolocationPosition
   * @param {Function} [onError] - 错误回调，接收 GeolocationPositionError
   */
  function startGpsTracking(onSuccess, onError) {
    stopGpsTracking();
    isStopped = false;
    gpsWatchId =  navigator.geolocation.watchPosition((position) => {
      onSuccess && onSuccess(position);
    }, (error) => {
      // 如果已经主动停止，则忽略错误并退出
      if (isStopped) return;

      console.error(`GPS 定位中断 (${error.code}): ${error.message}`);
      try {
        onError && onError(error);
      } catch (e) {
        console.error('GPS 错误回调执行异常:', e);
      }

      // 无限重试：清除旧定时器，设置新的
      if (gpsRetryTimer !== null) {
        clearTimeout(gpsRetryTimer);
        gpsRetryTimer = null;
      }
      gpsRetryTimer = setTimeout(() => {
        // 定时器触发时，若未被停止，则重新启动
        if (!isStopped) {
          console.log("正在尝试自动恢复GPS实时定位...")
          startGpsTracking(onSuccess, onError);
        }
      }, retryTimeout);
    }, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    })
  }

  /**
   * 停止 GPS 实时定位
   * 会清除当前的 watch 和待执行的重试定时器。
   */
  function stopGpsTracking() {
    // 标记停止，防止定时器回调误重启
    isStopped = true;

    // 清除 watch
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }

    // 清除待执行的重试定时器
    if (gpsRetryTimer !== null) {
      clearTimeout(gpsRetryTimer);
      gpsRetryTimer = null;
    }
  }

  /**
   * 打开相机（显示 iframe 并加载 camera.html）
   *
   * @param {Function} [onReady] - 相机加载完成后的回调
   */
  function openCamera(onReady) {
    if (cameraFrame) {
      // 如果相机已打开，则直接回调
      if (cameraReady) {
        onReady && onReady();
        return;
      }

      // 绑定加载完成事件（一次性）
      const loadHandler = () => {
        cameraReady = true;
        onReady && onReady();
        cameraFrame.removeEventListener('load', loadHandler);
      };
      cameraFrame.addEventListener('load', loadHandler);

      // 显示 iframe 并加载页面
      cameraFrame.src = 'camera.html';
      toggleClass(cameraFrame, 'd-none', false);
    } else {
      console.warn('外部未提供 cameraFrame');
    }
  }

  /**
   * 关闭相机（隐藏 iframe 并清理状态）
   *
   * @param {Function} [onClosed] - 关闭后的回调
   */
  function closeCamera(onClosed) {
    if (cameraFrame) {
      cameraReady = false;
      toggleClass(cameraFrame, 'd-none', true);
      cameraFrame.src = 'about:blank';
      delete cameraFrame.dataset.id;
      delete cameraFrame.dataset.origin;
    } else {
      console.warn('外部未提供 cameraFrame');
    }
    onClosed && onClosed();
  }

  // ----- 公共 API 暴露 ----------------------------------------------------
  return {
    startGpsTracking,
    stopGpsTracking,
    openCamera,
    closeCamera
  }
})()
window.$ = Capabilities;