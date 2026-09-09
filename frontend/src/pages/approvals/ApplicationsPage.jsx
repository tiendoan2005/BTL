import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Space, Table, Tag, Tabs, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fetchPaged, fmtNumber } from '../data/ratesHelpers';

const STATUS_COLORS = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  DOCS_REQUIRED: 'blue',
};

const TYPE_LABELS = {
  LOAN: 'Vay vốn',
  CARD_ISSUANCE: 'Phát hành thẻ',
  LIMIT_APPROVAL: 'Duyệt hạn mức',
};

/** Trang danh sách hồ sơ chờ xử lý - tabs theo trạng thái. */
export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [statusTab, setStatusTab] = useState('');
  const [filters, setFilters] = useState({ keyword: '', type: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (statusTab) params.status = statusTab;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.type) params.type = filters.type;
      const data = await fetchPaged('/applications', params);
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, filters]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: 'Mã hồ sơ', dataIndex: 'applicationCode',
      render: (v) => <b>{v}</b> },
    { title: 'Khách hàng', dataIndex: 'customerName' },
    { title: 'Loại hồ sơ', dataIndex: 'type', width: 140,
      render: (v) => TYPE_LABELS[v] || v },
    { title: 'Số tiền (VNĐ)', dataIndex: 'requestedAmount', align: 'right',
      render: (v) => (v != null ? fmtNumber(v) : '-') },
    { title: 'Trạng thái', dataIndex: 'status', width: 130,
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v}</Tag> },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 120,
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-') },
    {
      title: '',
      width: 90,
      render: (_, record) => (
        <a onClick={() => navigate(`/approvals/${record.id}`)}>Xử lý →</a>
      ),
    },
  ];

  const tabItems = [
    { key: '', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'DOCS_REQUIRED', label: 'Cần bổ sung' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Từ chối' },
  ];

  return (
    <Card
      title="Phê duyệt hồ sơ"
      extra={
        <Space>
          <Input
            placeholder="Mã hồ sơ / tên KH"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onPressEnter={(e) => { setPage(0); setFilters((f) => ({ ...f, keyword: e.target.value })); }}
          />
          <Select
            placeholder="Loại hồ sơ"
            allowClear
            style={{ width: 160 }}
            value={filters.type || undefined}
            onChange={(v) => { setPage(0); setFilters((f) => ({ ...f, type: v || '' })); }}
            options={[
              { value: 'LOAN', label: 'Vay vốn' },
              { value: 'CARD_ISSUANCE', label: 'Phát hành thẻ' },
              { value: 'LIMIT_APPROVAL', label: 'Duyệt hạn mức' },
            ]}
          />
        </Space>
      }
    >
      <Tabs
        activeKey={statusTab}
        items={tabItems}
        onChange={(key) => { setPage(0); setStatusTab(key); }}
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: 10,
          total,
          showTotal: (t) => `Tổng ${t} hồ sơ`,
          onChange: (p) => setPage(p - 1),
        }}
      />
    </Card>
  );
}
