import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm,
  Space, Table, Upload, message,
} from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fetchPaged, fmtDate } from './ratesHelpers';

const { RangePicker } = DatePicker;

/** Trang Lãi suất: CRUD + import Excel + filter theo sản phẩm & ngày. */
export default function InterestRatesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ product: '', range: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (filters.product) params.product = filters.product;
      if (filters.range) {
        params.from = filters.range[0].format('YYYY-MM-DD');
        params.to = filters.range[1].format('YYYY-MM-DD');
      }
      const data = await fetchPaged('/interest-rates', params);
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
        await client.put(`/interest-rates/${editing.id}`, payload);
        message.success('Đã cập nhật lãi suất');
      } else {
        await client.post('/interest-rates', payload);
        message.success('Đã thêm lãi suất');
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
      await client.delete(`/interest-rates/${id}`);
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
      const res = await client.post('/interest-rates/import', fd, {
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
    { title: 'Sản phẩm', dataIndex: 'productCode', render: (v) => <b>{v}</b> },
    { title: 'Kỳ hạn (tháng)', dataIndex: 'termMonths', align: 'right' },
    { title: 'Lãi suất (%/năm)', dataIndex: 'ratePercentage', align: 'right',
      render: (v) => `${Number(v).toFixed(2)}%` },
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
      title="Lãi suất"
      extra={
        <Space>
          <Input
            placeholder="Mã sản phẩm (SAVING...)"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 190 }}
            onPressEnter={(e) => { setPage(0); setFilters((f) => ({ ...f, product: e.target.value })); }}
          />
          <RangePicker
            onChange={(range) => { setPage(0); setFilters((f) => ({ ...f, range })); }}
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Upload accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={onImportFile}>
            <Button icon={<ImportOutlined />} loading={importing}>Import Excel</Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Thêm lãi suất
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
        title={editing ? `Sửa lãi suất ${editing.productCode}` : 'Thêm lãi suất mới'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã sản phẩm" name="productCode"
            rules={[{ required: true, message: 'Nhập mã sản phẩm' }]}>
            <Input placeholder="SAVING_ONLINE / LOAN_MORTGAGE" maxLength={50} />
          </Form.Item>
          <Form.Item label="Kỳ hạn (tháng)" name="termMonths"
            rules={[{ required: true, message: 'Nhập kỳ hạn' }]}>
            <InputNumber min={1} max={360} style={{ width: '100%' }} placeholder="6" />
          </Form.Item>
          <Form.Item label="Lãi suất (%/năm)" name="ratePercentage"
            rules={[{ required: true, message: 'Nhập lãi suất' }]}>
            <InputNumber min={0} max={100} step={0.01} style={{ width: '100%' }} placeholder="5.20" />
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
