/**
 * useToast 组合函数
 * 封装项目全局 $toast，避免在 setup 中直接使用 getCurrentInstance().proxy
 *
 * 用法：
 *   const { toast, success, error, info } = useToast();
 *   toast({ text: '提示', icon: 'success' });
 *   success('操作成功');
 *   error('操作失败');
 */
export function useToast() {
  const toast = (options = {}) => {
    if (typeof window !== 'undefined' && typeof window.$toast === 'function') {
      window.$toast(options);
    }
  };

  const success = (text, duration = 3000) => {
    toast({ text, icon: 'success', duration });
  };

  const error = (text, duration = 3000) => {
    toast({ text, icon: 'error', duration });
  };

  const info = (text, duration = 3000) => {
    toast({ text, icon: 'info', duration });
  };

  return {
    toast,
    success,
    error,
    info,
  };
}

export default useToast;
