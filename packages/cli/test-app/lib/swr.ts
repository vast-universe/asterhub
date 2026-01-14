/**
 * SWR 配置和封装
 */

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("请求失败");
  }
  return res.json();
};

export { fetcher };
