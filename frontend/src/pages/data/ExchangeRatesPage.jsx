import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select,
  Space, Table, Upload, message,
} from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fetchPaged, fmtDate, fmtNumber } from './ratesHelpers';

const { RangePicker } = DatePicker;

/**
 * Trang Tỷ giá ngoại tệ: CRUD + import Excel + filter ngày hiệu lực.
 */
export default function ExchangeRatesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ currency: '', range: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // row hoặc null=thêm mới
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filters.currency) params.currency = filters.currency;
      if (filters.range) {
        params.from = filters.range[0].format('YYYY-MM-DD');
        params.to = filters.range[1].format('YYYY-MM-DD');
      }
      const data = await fetchPaged('/exchange-rates', params);
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
      const payload = {
        ...values,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
      };
      if (editing) {
        await client.put(`/exchange-rates/${editing.id}`, payload);
        message.success('Đã cập nhật tỷ giá');
      } else {
        await client.post('/exchange-rates', payload);
        message.success('Đã thêm tỷ giá');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.errorFields) return; // lỗi validate form
      message.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await client.delete(`/exchange-rates/${id}`);
      message.success('Đã xóa');
      load();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  // Đọc file chọn trong Upload -> gửi thẳng lên /import
  const onImportFile = async (file) => {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await client.post('/exchange-rates/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const s = res.data?.data || {};
      message.success(`Import xong: ${s.inserted ?? 0} thêm, ${s.updated ?? 0} cập nhật, ${s.skipped ?? 0} bỏ qua`);
      load();
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setImporting(false);
    }
    return false; // chặn upload mặc định của antd
  };

  const columns = [
    { title: 'Mã NT', dataIndex: 'currencyCode', width: 90, render: (v) => <b>{v}</b> },
    { title: 'Mua (tiền mặt)', dataIndex: 'buyRate', align: 'right', render: fmtNumber },
    { title: 'Bán (tiền mặt)', dataIndex: 'sellRate', align: 'right', render: fmtNumber },
    { title: 'Chuyển khoản', dataIndex: 'transferRate', align: 'right', render: fmtNumber },
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
      title="Tỷ giá ngoại tệ"
      extra={
        <Space>
          <Input
            placeholder="Mã ngoại tệ (USD...)"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 180 }}
            onPressEnter={(e) => { setPage(0); setFilters((f) => ({ ...f, currency: e.target.value })); }}
          />
          <RangePicker
            onChange={(range) => { setPage(0); setFilters((f) => ({ ...f, range })); }}
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={onImportFile}>
            <Button icon={<ImportOutlined />} loading={importing}>Import Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Thêm tỷ giá
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
        title={editing ? `Sửa tỷ giá ${editing.currencyCode}` : 'Thêm tỷ giá mới'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã ngoại tệ" name="currencyCode"
            rules={[{ required: true, message: 'Nhập mã ngoại tệ' }]}>
            <Input placeholder="USD" maxLength={10} disabled={!!editing} />
          </Form.Item>
          <Form.Item label="Tỷ giá mua" name="buyRate"
            rules={[{ required: true, message: 'Nhập tỷ giá mua' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="25400" />
          </Form.Item>
          <Form.Item label="Tỷ giá bán" name="sellRate"
            rules={[{ required: true, message: 'Nhập tỷ giá bán' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="25800" />
          </Form.Item>
          <Form.Item label="Tỷ giá chuyển khoản" name="transferRate"
            rules={[{ required: true, message: 'Nhập tỷ giá chuyển khoản' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
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
