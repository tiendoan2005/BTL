import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm,
  Space, Table, Upload, message,
} from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fetchPaged, fmtDate, fmtNumber } from './ratesHelpers';

const { RangePicker } = DatePicker;

/** Trang Giá vàng: CRUD + import Excel + filter. */
export default function GoldRatesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ type: '', range: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filters.type) params.type = filters.type;
      if (filters.range) {
        params.from = filters.range[0].format('YYYY-MM-DD');
        params.to = filters.range[1].format('YYYY-MM-DD');
      }
      const data = await fetchPaged('/gold-rates', params);
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openModal = (record = null) => {
    setEditing(record);
    form.setFieldsValue(record ? {
      ...record,
      effectiveDate: dayjs(record.effectiveDate),
    } : { effectiveDate: dayjs() });
    setModalOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = { ...values, effectiveDate: values.effectiveDate.format('YYYY-MM-DD') };
      if (editing) {
        await client.put(`/gold-rates/${editing.id}`, payload);
        message.success('Đã cập nhật giá vàng');
      } else {
        await client.post('/gold-rates', payload);
        message.success('Đã thêm giá vàng');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.errorFields) return;
      message.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await client.delete(`/gold-rates/${id}`);
      message.success('Đã xóa');
      load();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  const onImportFile = async (file) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await client.post('/gold-rates/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const s = res.data?.data || {};
      message.success(`Import xong: ${s.inserted ?? 0} thêm, ${s.skipped ?? 0} bỏ qua`);
      load();
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setImporting(false);
    }
    return false;
  };

  const columns = [
    { title: 'Loại vàng', dataIndex: 'goldType', render: (v) => <b>{v}</b> },
    { title: 'Giá mua (VNĐ/lượng)', dataIndex: 'buyPrice', align: 'right', render: fmtNumber },
    { title: 'Giá bán (VNĐ/lượng)', dataIndex: 'sellPrice', align: 'right', render: fmtNumber },
    { title: 'Ngày hiệu lực', dataIndex: 'effectiveDate', width: 120, render: fmtDate },
    { title: 'Người cập nhật', dataIndex: 'createdByName', render: (v) => v || '-' },
    {
      title: '',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa bản ghi này?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Giá vàng"
      extra={
        <Space>
          <Input
            placeholder="Loại vàng (SJC, 24K...)"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 180 }}
            onPressEnter={(e) => { setPage(0); setFilters((f) => ({ ...f, type: e.target.value })); }}
          />
          <RangePicker
            onChange={(range) => { setPage(0); setFilters((f) => ({ ...f, range })); }}
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={onImportFile}>
            <Button icon={<ImportOutlined />} loading={importing}>Import Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Thêm giá vàng
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: 10,
          total,
          showTotal: (t) => `Tổng ${t} bản ghi`,
          onChange: (p) => setPage(p - 1),
        }}
      />

      <Modal
        open={modalOpen}
        title={editing ? `Sửa giá vàng ${editing.goldType}` : 'Thêm giá vàng mới'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Loại vàng" name="goldType"
            rules={[{ required: true, message: 'Nhập loại vàng' }]}>
            <Input placeholder="SJC / 24K / 18K" maxLength={50} />
          </Form.Item>
          <Form.Item label="Giá mua (VNĐ/lượng)" name="buyPrice"
            rules={[{ required: true, message: 'Nhập giá mua' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="84000000" />
          </Form.Item>
          <Form.Item label="Giá bán (VNĐ/lượng)" name="sellPrice"
            rules={[{ required: true, message: 'Nhập giá bán' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="86000000" />
          </Form.Item>
          <Form.Item label="Ngày hiệu lực" name="effectiveDate"
            rules={[{ required: true, message: 'Chọn ngày hiệu lực' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
