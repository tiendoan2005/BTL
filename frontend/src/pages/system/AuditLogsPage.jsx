import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MODULE_COLORS = {
  System: 'purple',
  DATA: 'blue',
  APPROVAL: 'volcano',
  REPORT: 'green',
  CMS: 'cyan',
  AUTH: 'gold',
};

const ACTION_COLORS = {
  LOGIN: 'green',
  CREATE_USER: 'cyan',
  UPDATE_USER: 'blue',
  DELETE_USER: 'red',
  UPDATE_ROLE: 'purple',
  CREATE_POST: 'geekblue',
  UPDATE_POST: 'blue',
  DELETE_POST: 'magenta',
  APPROVE_APPLICATION: 'success',
  REJECT_APPLICATION: 'error',
  CANCEL_APPLICATION: 'warning',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    module: undefined,
    dateRange: null,
  });

  // Modal chi tiết log
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadLogs = async (p = page, ps = pageSize, flt = filters) => {
    setLoading(true);
    try {
      const params = {
        page: p - 1,
        size: ps,
      };
      if (flt.action) params.action = flt.action;
      if (flt.module) params.module = flt.module;
      if (flt.dateRange && flt.dateRange[0] && flt.dateRange[1]) {
        params.from = flt.dateRange[0].toISOString();
        params.to = flt.dateRange[1].toISOString();
      }

      const res = await client.get('/system/audit-logs', { params });
      setLogs(res.data?.data?.content || []);
      setTotal(res.data?.data?.totalElements || 0);
    } catch (err) {
      message.error('Không thể tải nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1, pageSize, filters);
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadLogs(1, pageSize, filters);
  };

  const handleReset = () => {
    const empty = { action: '', module: undefined, dateRange: null };
    setFilters(empty);
    setPage(1);
    loadLogs(1, pageSize, empty);
  };

  const openDetail = (record) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const formatJson = (str) => {
    if (!str) return 'Không có dữ liệu';
    try {
      const obj = typeof str === 'string' ? JSON.parse(str) : str;
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(str);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      width: 170,
      render: (ts) => (
        <Text style={{ fontSize: 13 }}>
          {ts ? new Date(ts).toLocaleString('vi-VN') : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'username',
      width: 180,
      render: (uname, record) => (
        <div>
          <Space size={4}>
            <UserOutlined style={{ color: '#1565c0' }} />
            <Text strong>{uname || 'SYSTEM'}</Text>
          </Space>
          {record.userFullName && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.userFullName}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Phân hệ',
      dataIndex: 'moduleName',
      width: 110,
      render: (mod) => (
        <Tag color={MODULE_COLORS[mod] || 'default'} style={{ fontWeight: 600 }}>
          {mod}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'actionType',
      width: 180,
      render: (act) => (
        <Tag color={ACTION_COLORS[act] || 'blue'} style={{ fontFamily: 'monospace' }}>
          {act}
        </Tag>
      ),
    },
    {
      title: 'Mô tả chi tiết',
      dataIndex: 'description',
      ellipsis: true,
      render: (desc) => <Text>{desc || '-'}</Text>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      width: 130,
      render: (ip) => (
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {ip || '127.0.0.1'}
        </Text>
      ),
    },
    {
      title: 'Chi tiết',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Nhật ký Hoạt động Hệ thống (Audit Logs)
          </Title>
          <Text type="secondary">
            Ghi vết toàn bộ thao tác thêm, sửa, xóa, phân quyền và phê duyệt nghiệp vụ
          </Text>
        </Col>
      </Row>

      <Card>
        {/* Bộ lọc tra cứu */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Hành động (vd: CREATE, UPDATE...)"
              prefix={<SearchOutlined />}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Chọn phân hệ"
              style={{ width: '100%' }}
              allowClear
              value={filters.module}
              onChange={(val) => setFilters({ ...filters, module: val })}
            >
              <Option value="System">System (Hệ thống & Tài khoản)</Option>
              <Option value="DATA">DATA (Dữ liệu biến động)</Option>
              <Option value="APPROVAL">APPROVAL (Phê duyệt hồ sơ)</Option>
              <Option value="REPORT">REPORT (Báo cáo & Thống kê)</Option>
              <Option value="CMS">CMS (Quản trị nội dung)</Option>
              <Option value="AUTH">AUTH (Đăng nhập / Xác thực)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={10} md={7}>
            <RangePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm"
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} sm={6} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ backgroundColor: '#1565c0' }}
              >
                Tìm kiếm
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Đặt lại
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              loadLogs(p, ps, filters);
            },
            showTotal: (t) => `Tổng số ${t} bản ghi nhật ký`,
          }}
        />
      </Card>

      {/* MODAL CHI TIẾT AUDIT LOG */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1565c0' }} />
            <span>Chi tiết bản ghi Audit Log #{selectedLog?.id}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
        ]}
        width={750}
      >
        {selectedLog && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
              <Descriptions.Item label="Thời gian">
                {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString('vi-VN') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedLog.status === 'SUCCESS' ? 'green' : 'red'}>
                  {selectedLog.status}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Người thực hiện">
                <Text strong>{selectedLog.username}</Text>{' '}
                {selectedLog.userFullName && `(${selectedLog.userFullName})`}
              </Descriptions.Item>
              <Descriptions.Item label="Phân hệ">
                <Tag color={MODULE_COLORS[selectedLog.moduleName] || 'default'}>
                  {selectedLog.moduleName}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Hành động">
                <Tag color={ACTION_COLORS[selectedLog.actionType] || 'blue'}>
                  {selectedLog.actionType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP">
                <Text code>{selectedLog.ipAddress || '127.0.0.1'}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả" span={2}>
                {selectedLog.description}
              </Descriptions.Item>

              <Descriptions.Item label="User Agent" span={2}>
                <Text type="secondary" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                  {selectedLog.userAgent || 'N/A'}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
              Dữ liệu thay đổi (Payload State)
            </Divider>

            <Row gutter={12}>
              <Col span={12}>
                <Text strong type="secondary">
                  Trước thay đổi (Before):
                </Text>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 11,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 4,
                  }}
                >
                  {formatJson(selectedLog.payloadBefore)}
                </pre>
              </Col>
              <Col span={12}>
                <Text strong type="secondary">
                  Sau thay đổi (After):
                </Text>
                <pre
                  style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    padding: 8,
                    borderRadius: 4,
                    fontSize: 11,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 4,
                  }}
                >
                  {formatJson(selectedLog.payloadAfter)}
                </pre>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
