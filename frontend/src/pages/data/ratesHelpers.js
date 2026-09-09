// Helpers dùng chung cho các trang Dữ liệu biến động
import client, { unwrap } from '../../api/client';

/** Chuẩn hoá lỗi -> message tiếng Việt hiển thị qua antd message */
export function extractError(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error') return 'Không kết nối được máy chủ (backend chưa chạy?)';
  return err.message || 'Có lỗi xảy ra';
}

/** Gọi API phân trang chuẩn PagedResponse { content, totalElements } -> state cho Table */
export async function fetchPaged(url, params) {
  const data = await unwrap(client.get(url, { params }));
  return {
    rows: data.content || [],
    total: Number(data.totalElements ?? 0),
  };
}

/** Format số tiền VNĐ: 25400 -> "25,400" (không hiện .0000 thừa) */
export function fmtNumber(value) {
  if (value == null) return '-';
  const n = Number(value);
  return Number.isInteger(n)
    ? n.toLocaleString('vi-VN')
    : n.toLocaleString('vi-VN', { minimumFractionDigits: 2 });
}

/** Format ngày ISO yyyy-MM-dd -> dd/MM/yyyy */
export function fmtDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
