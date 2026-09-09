import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Card, Col, Descriptions, Form, Input, List, Modal, Radio,
  Row, Space, Spin, Tag, Timeline, message,
} from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError, fmtNumber } from '../data/ratesHelpers';

const STATUS_COLORS = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red', DOCS_REQUIRED: 'blue' };
const ACTION_LABELS = { APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', REQUEST_DOCS: 'Yêu cầu bổ sung' };
const ACTION_COLORS = { APPROVED: 'green', REJECTED: 'red', REQUEST_DOCS: 'blue' };

/** Chi tiết hồ sơ: thông tin KH + chứng từ + lịch sử xử lý + modal quyết định. */
export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get(`/applications/${id}`).then((r) => r.data.data);
      setApp(data);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const canProcess = app?.status === 'PENDING' || app?.status === 'DOCS_REQUIRED';

  const onDecide = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await client.post(`/applications/${id}/decision`, values);
      message.success(res.data?.message || 'Đã xử lý hồ sơ');
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.errorFields) return;
      message.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Bật/tắt bắt buộc lý do theo quyết định chọn
  const selectedAction = Form.useWatch('action', form);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!app) return null;

  return (
    <>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/approvals')} />
            Hồ sơ {app.applicationCode}
            <Tag color={STATUS_COLORS[app.status]}>{app.status}</Tag>
          </Space>
        }
        extra={canProcess && (
          <Button type="primary" onClick={() => { form.resetFields(); form.setFieldValue('action', 'APPROVED'); setModalOpen(true); }}>
            Xử lý hồ sơ
          </Button>
        )}
      >
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Descriptions title="Thông tin hồ sơ" bordered column={1} size="small">
              <Descriptions.Item label="Mã hồ sơ">{app.applicationCode}</Descriptions.Item>
              <Descriptions.Item label="Loại hồ sơ">{app.type}</Descriptions.Item>
              <Descriptions.Item label="Số tiền đề nghị">
                {app.requestedAmount != null ? `${fmtNumber(app.requestedAmount)} VNĐ` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tiếp nhận">
                {dayjs(app.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions
              title="Khách hàng"
              bordered column={1} size="small"
              style={{ marginTop: 24 }}
            >
              <Descriptions.Item label="Họ tên">{app.customer.fullName}</Descriptions.Item>
              <Descriptions.Item label="CCCD">{app.customer.idCardNumber}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{app.customer.phoneNumber}</Descriptions.Item>
              <Descriptions.Item label="Email">{app.customer.email || '-'}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Col xs={24} lg={12}>
            <Card type="inner" title={`Chứng từ đính kèm (${app.documents.length})`} size="small">
              <List
                size="small"
                dataSource={app.documents}
                locale={{ emptyText: 'Không có chứng từ' }}
                renderItem={(doc) => (
                  <List.Item
                    actions={[
                      <a href={`${doc.fileUrl}`} target="_blank" rel="noreferrer" key="view">Xem</a>,
                    ]}
                  >
                    <Space>
                      <FileTextOutlined />
                      {doc.documentName}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Card type="inner" title="Lịch sử xử lý" size="small" style={{ marginTop: 16 }}>
              {app.approvals.length === 0 ? (
                <span style={{ color: '#999' }}>Chưa có lịch sử xử lý</span>
              ) : (
                <Timeline
                  items={app.approvals.map((h) => ({
                    color: ACTION_COLORS[h.action],
                    children: (
                      <>
                        <b>{ACTION_LABELS[h.action]}</b> — {h.managerName}
                        <br />
                        <small>{dayjs(h.processedAt).format('DD/MM/YYYY HH:mm')}</small>
                        {h.reasonNote && (<><br /><i>{h.reasonNote}</i></>)}
                      </>
                    ),
                  }))}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        open={modalOpen}
        title={`Xử lý hồ sơ ${app.applicationCode}`}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={submitting}
        onOk={onDecide}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ action: 'APPROVED' }}>
          <Form.Item name="action" label="Quyết định"
            rules={[{ required: true, message: 'Chọn quyết định' }]}>
            <Radio.Group
              options={[
                { value: 'APPROVED', label: 'Duyệt hồ sơ' },
                { value: 'REJECTED', label: 'Từ chối' },
                { value: 'REQUEST_DOCS', label: 'Yêu cầu bổ sung giấy tờ' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="reasonNote"
            label="Lý do / ghi chú"
            rules={selectedAction === 'REJECTED' || selectedAction === 'REQUEST_DOCS'
              ? [{ required: true, message: 'Vui lòng nhập lý do' }] : []}
          >
            <Input.TextArea rows={3} maxLength={2000}
              placeholder={selectedAction === 'REQUEST_DOCS'
                ? 'Liệt kê giấy tờ cần bổ sung...' : 'Ghi chú (không bắt buộc với hồ sơ duyệt)'} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
