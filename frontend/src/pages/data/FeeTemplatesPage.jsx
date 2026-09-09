import { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table,
  Tag, Upload, message,
} from 'antd';
import { PlusOutlined, DownloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fetchPaged } from './ratesHelpers';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const FILE_TYPE_COLORS = {
  EXCEL: 'green',
  PDF: 'red',
  CSV: 'blue',
};

/** Trang Biểu phí & biểu mẫu: upload file, sửa tiêu đề, bật/tắt kích hoạt, tải xuống. */
export default function FeeTemplatesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [titleFilter, setTitleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  // File chọn trong modal: { originFileObj } - chỉ bắt buộc khi thêm mới
  const [fileList, setFileList] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (titleFilter) params.title = titleFilter;
      const data = await fetchPaged('/fee-templates', params);
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, titleFilter]);

  useEffect(() => { load(); }, [load]);

  const openModal = (record = null) => {
    setEditing(record);
    setFileList([]);
    form.setFieldsValue(record
      ? { title: record.title, isActive: record.isActive }
      : { title: '', isActive: true });
    setModalOpen(true);
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const hasFile = fileList.length > 0 && fileList[0].originFileObj;
      if (!editing && !hasFile) {
        message.warning('Chọn file đính kèm');
        return;
      }
      setSaving(true);
      const fd = new FormData();
      fd.append('title', values.title);
      if (values.isActive !== undefined) fd.append('isActive', String(values.isActive));
      if (hasFile) fd.append('file', fileList[0].originFileObj);

      if (editing) {
        await client.put(`/fee-templates/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Đã cập nhật biểu mẫu');
      } else {
        await client.post('/fee-templates', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        message.success('Đã tải lên biểu mẫu');
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
      await client.delete(`/fee-templates/${id}`);
      message.success('Đã xóa');
      load();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  const onToggleActive = async (record, checked) => {
    try {
      const fd = new FormData();
      fd.append('title', record.title);
      fd.append('isActive', String(checked));
      await client.put(`/fee-templates/${record.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success(checked ? 'Đã kích hoạt' : 'Đã ẩn biểu mẫu');
      load();
    } catch (err) {
      message.error(extractError(err));
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title' },
    {
      title: 'File',
      dataIndex: 'filePath',
      render: (_, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          href={`${API_BASE}${record.filePath}`}
          target="_blank"
        >
          Tải xuống
        </Button>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'fileType',
      width: 90,
      render: (v) => <Tag color={FILE_TYPE_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Kích hoạt',
      dataIndex: 'isActive',
      width: 110,
      render: (_, record) => (
        <Switch checked={record.isActive} onChange={(c) => onToggleActive(record, c)} />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 130,
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
    },
    {
      title: '',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openModal(record)}>Sửa</Button>
          <Popconfirm title="Xóa biểu mẫu này?" onConfirm={() => onDelete(record.id)}>
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Biểu phí & biểu mẫu"
      extra={
        <Space>
          <Input
            placeholder="Tìm theo tiêu đề"
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            onPressEnter={(e) => { setPage(0); setTitleFilter(e.target.value); }}
          />
          <Button type="primary" icon={<UploadOutlined />} onClick={() => openModal()}>
            Tải lên biểu mẫu
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
          showTotal: (t) => `Tổng ${t} biểu mẫu`,
          onChange: (p) => setPage(p - 1),
        }}
      />

      <Modal
        open={modalOpen}
        title={editing ? `Sửa: ${editing.title}` : 'Tải lên biểu mẫu mới'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        onOk={onSave}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tiêu đề" name="title"
            rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Bảng biểu phí dịch vụ thẻ 2026" maxLength={255} />
          </Form.Item>
          <Form.Item label={editing ? 'Thay file mới (không bắt buộc)' : 'File đính kèm'}
            required={!editing}>
            <Upload
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
              accept=".xlsx,.xls,.csv,.pdf"
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Kích hoạt" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
