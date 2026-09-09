import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
  Image,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import client from '../../api/client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_CONFIG = {
  DRAFT: { label: 'Bản nháp', color: 'orange' },
  PUBLISHED: { label: 'Đã xuất bản', color: 'green' },
  ARCHIVED: { label: 'Lưu trữ', color: 'default' },
};

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState('posts');

  // ==================== POSTS STATE ====================
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ keyword: '', status: undefined, categoryId: undefined });

  // Post modal edit / create
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);
  const [postForm] = Form.useForm();
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState('');

  // ==================== CATEGORIES STATE ====================
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryForm] = Form.useForm();
  const [savingCategory, setSavingCategory] = useState(false);

  // ==================== FETCH DATA ====================

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await client.get('/cms/categories');
      setCategories(res.data?.data || []);
    } catch (e) {
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadPosts = async (p = page, ps = pageSize, flt = filters) => {
    setLoadingPosts(true);
    try {
      const params = {
        page: p - 1,
        size: ps,
      };
      if (flt.keyword) params.keyword = flt.keyword;
      if (flt.status) params.status = flt.status;
      if (flt.categoryId) params.categoryId = flt.categoryId;

      const res = await client.get('/cms/posts', { params });
      setPosts(res.data?.data?.content || []);
      setTotalPosts(res.data?.data?.totalElements || 0);
    } catch (e) {
      message.error('Không thể tải danh sách bài viết');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadPosts(1, pageSize, filters);
  }, []);

  const handleSearch = () => {
    setPage(1);
    loadPosts(1, pageSize, filters);
  };

  const handleResetSearch = () => {
    const emptyFilters = { keyword: '', status: undefined, categoryId: undefined };
    setFilters(emptyFilters);
    setPage(1);
    loadPosts(1, pageSize, emptyFilters);
  };

  // ==================== POST ACTIONS ====================

  const openCreatePostModal = () => {
    setEditingPost(null);
    setPreviewThumbnail('');
    postForm.resetFields();
    postForm.setFieldsValue({
      status: 'DRAFT',
    });
    setPostModalVisible(true);
  };

  const openEditPostModal = (record) => {
    setEditingPost(record);
    setPreviewThumbnail(record.thumbnailUrl || '');
    postForm.setFieldsValue({
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      content: record.content,
      thumbnailUrl: record.thumbnailUrl,
      categoryId: record.category?.id,
      status: record.status,
    });
    setPostModalVisible(true);
  };

  const handleSavePost = async () => {
    try {
      const values = await postForm.validateFields();
      setSavingPost(true);
      if (editingPost) {
        await client.put(`/cms/posts/${editingPost.id}`, values);
        message.success('Cập nhật bài viết thành công');
      } else {
        await client.post('/cms/posts', values);
        message.success('Tạo bài viết mới thành công');
      }
      setPostModalVisible(false);
      loadPosts(page, pageSize, filters);
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi lưu bài viết');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (id) => {
    try {
      await client.delete(`/cms/posts/${id}`);
      message.success('Đã xóa bài viết');
      loadPosts(page, pageSize, filters);
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xóa bài viết');
    }
  };

  const handleChangePostStatus = async (id, status) => {
    try {
      await client.patch(`/cms/posts/${id}/status`, { status });
      message.success(`Đã chuyển trạng thái sang ${STATUS_CONFIG[status]?.label || status}`);
      loadPosts(page, pageSize, filters);
    } catch (err) {
      message.error('Không thể đổi trạng thái bài viết');
    }
  };

  const handleThumbnailUpload = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingThumbnail(true);
    try {
      const res = await client.post('/cms/posts/thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url;
      postForm.setFieldsValue({ thumbnailUrl: url });
      setPreviewThumbnail(url);
      message.success('Đã upload thumbnail');
    } catch (err) {
      message.error('Upload thumbnail thất bại');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // ==================== CATEGORY ACTIONS ====================

  const handleSaveCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      setSavingCategory(true);
      await client.post('/cms/categories', values);
      message.success('Tạo chuyên mục thành công');
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      loadCategories();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Lỗi tạo chuyên mục');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await client.delete(`/cms/categories/${id}`);
      message.success('Đã xóa chuyên mục');
      loadCategories();
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể xóa chuyên mục');
    }
  };

  // ==================== POSTS COLUMNS ====================

  const postColumns = [
    {
      title: 'Thumbnail',
      dataIndex: 'thumbnailUrl',
      width: 90,
      render: (url) =>
        url ? (
          <Image
            src={url}
            alt="thumb"
            width={64}
            height={44}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="https://via.placeholder.com/64x44?text=News"
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 44,
              background: '#f0f2f5',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8c8c8c',
              fontSize: 11,
            }}
          >
            No Img
          </div>
        ),
    },
    {
      title: 'Tiêu đề & Tóm tắt',
      dataIndex: 'title',
      render: (title, record) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {title}
          </Text>
          <div style={{ marginTop: 2 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>
              slug: {record.slug}
            </Tag>
            {record.category && (
              <Tag color="cyan" style={{ fontSize: 11 }}>
                {record.category.name}
              </Tag>
            )}
          </div>
          {record.summary && (
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ margin: '4px 0 0', fontSize: 12 }}
            >
              {record.summary}
            </Paragraph>
          )}
        </div>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'authorName',
      width: 140,
      render: (author) => <Text>{author || 'N/A'}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (st) => {
        const conf = STATUS_CONFIG[st] || { label: st, color: 'default' };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Ngày xuất bản / Tạo',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.publishedAt ? (
            <div>
              <Text type="success">Xuất bản:</Text>{' '}
              {new Date(r.publishedAt).toLocaleString('vi-VN')}
            </div>
          ) : (
            <div>
              <Text type="secondary">Tạo:</Text>{' '}
              {new Date(r.createdAt).toLocaleString('vi-VN')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      width: 180,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditPostModal(record)}
          >
            Sửa
          </Button>
          {record.status !== 'PUBLISHED' && (
            <Button
              size="small"
              type="link"
              style={{ color: '#52c41a' }}
              onClick={() => handleChangePostStatus(record.id, 'PUBLISHED')}
            >
              Xuất bản
            </Button>
          )}
          {record.status === 'PUBLISHED' && (
            <Button
              size="small"
              type="link"
              style={{ color: '#fa8c16' }}
              onClick={() => handleChangePostStatus(record.id, 'ARCHIVED')}
            >
              Lưu trữ
            </Button>
          )}
          <Popconfirm
            title="Xác nhận xóa bài viết này?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeletePost(record.id)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== CATEGORIES COLUMNS ====================

  const categoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: 'Tên chuyên mục',
      dataIndex: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Slug URL',
      dataIndex: 'slug',
      render: (slug) => <Tag color="blue">{slug}</Tag>,
    },
    {
      title: 'Thao tác',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Xác nhận xóa chuyên mục này?"
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDeleteCategory(record.id)}
        >
          <Button size="small" type="link" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản trị Nội dung Web (CMS)
          </Title>
          <Text type="secondary">
            Đăng tải tin tức, thông báo khuyến mãi, sản phẩm dịch vụ ngân hàng
          </Text>
        </Col>
        <Col>
          <Space>
            {activeTab === 'posts' ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreatePostModal}
                style={{ backgroundColor: '#1565c0' }}
              >
                Viết bài mới
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  categoryForm.resetFields();
                  setCategoryModalVisible(true);
                }}
                style={{ backgroundColor: '#1565c0' }}
              >
                Thêm chuyên mục
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'posts',
            label: (
              <span>
                <FileTextOutlined /> Danh sách bài viết ({totalPosts})
              </span>
            ),
            children: (
              <Card>
                {/* Search filters */}
                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8} md={8}>
                    <Input
                      placeholder="Tìm kiếm tiêu đề, tóm tắt..."
                      prefix={<SearchOutlined />}
                      value={filters.keyword}
                      onChange={(e) =>
                        setFilters({ ...filters, keyword: e.target.value })
                      }
                      onPressEnter={handleSearch}
                      allowClear
                    />
                  </Col>
                  <Col xs={12} sm={6} md={5}>
                    <Select
                      placeholder="Chuyên mục"
                      style={{ width: '100%' }}
                      allowClear
                      value={filters.categoryId}
                      onChange={(val) =>
                        setFilters({ ...filters, categoryId: val })
                      }
                    >
                      {categories.map((c) => (
                        <Option key={c.id} value={c.id}>
                          {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={4}>
                    <Select
                      placeholder="Trạng thái"
                      style={{ width: '100%' }}
                      allowClear
                      value={filters.status}
                      onChange={(val) =>
                        setFilters({ ...filters, status: val })
                      }
                    >
                      <Option value="DRAFT">Bản nháp</Option>
                      <Option value="PUBLISHED">Đã xuất bản</Option>
                      <Option value="ARCHIVED">Lưu trữ</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={4} md={7}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={handleSearch}
                      >
                        Tìm kiếm
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={handleResetSearch}
                      >
                        Đặt lại
                      </Button>
                    </Space>
                  </Col>
                </Row>

                <Table
                  rowKey="id"
                  columns={postColumns}
                  dataSource={posts}
                  loading={loadingPosts}
                  pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: totalPosts,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20', '50'],
                    onChange: (p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                      loadPosts(p, ps, filters);
                    },
                    showTotal: (total) => `Tổng số ${total} bài viết`,
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'categories',
            label: (
              <span>
                <FolderOutlined /> Chuyên mục ({categories.length})
              </span>
            ),
            children: (
              <Card>
                <Table
                  rowKey="id"
                  columns={categoryColumns}
                  dataSource={categories}
                  loading={loadingCategories}
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* MODAL SOẠN THẢO BÀI VIẾT */}
      <Modal
        title={editingPost ? `Chỉnh sửa bài viết #${editingPost.id}` : 'Soạn thảo bài viết mới'}
        open={postModalVisible}
        onOk={handleSavePost}
        onCancel={() => setPostModalVisible(false)}
        confirmLoading={savingPost}
        width={800}
        destroyOnClose
        okText={editingPost ? 'Lưu thay đổi' : 'Tạo bài viết'}
        cancelText="Hủy"
      >
        <Form form={postForm} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="Tiêu đề bài viết"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề bài viết' }]}
              >
                <Input placeholder="Nhập tiêu đề tin tức, khuyến mãi..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="categoryId" label="Chuyên mục">
                <Select placeholder="Chọn chuyên mục" allowClear>
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="slug"
                label="Đường dẫn thân thiện (Slug)"
                tooltip="Để trống hệ thống sẽ tự sinh tự động từ tiêu đề"
              >
                <Input placeholder="tieu-de-than-thien (tự sinh nếu để trống)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Chọn trạng thái' }]}
              >
                <Select>
                  <Option value="DRAFT">Bản nháp</Option>
                  <Option value="PUBLISHED">Xuất bản ngay</Option>
                  <Option value="ARCHIVED">Lưu trữ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ảnh đại diện (Thumbnail)">
            <Row gutter={12} align="middle">
              <Col span={16}>
                <Form.Item name="thumbnailUrl" noStyle>
                  <Input
                    placeholder="URL ảnh hoặc upload bên phải"
                    value={previewThumbnail}
                    onChange={(e) => setPreviewThumbnail(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Upload
                  customRequest={handleThumbnailUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploadingThumbnail}>
                    Chọn ảnh upload
                  </Button>
                </Upload>
              </Col>
            </Row>
            {previewThumbnail && (
              <div style={{ marginTop: 8 }}>
                <Image
                  src={previewThumbnail}
                  alt="preview"
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item name="summary" label="Tóm tắt ngắn (Lead)">
            <TextArea
              rows={2}
              placeholder="Tóm tắt 1-2 câu nội dung chính của bài viết..."
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung chi tiết bài viết (HTML / Text)"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung bài viết' }]}
          >
            <TextArea
              rows={8}
              placeholder="<p>Nhập nội dung bài viết chi tiết...</p>"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL THÊM CHUYÊN MỤC */}
      <Modal
        title="Thêm chuyên mục mới"
        open={categoryModalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setCategoryModalVisible(false)}
        confirmLoading={savingCategory}
        destroyOnClose
        okText="Tạo chuyên mục"
        cancelText="Hủy"
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="Tên chuyên mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên chuyên mục' }]}
          >
            <Input placeholder="Ví dụ: Tin tức tài chính, Khuyến mãi thẻ..." />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug chuyên mục (tùy chọn)"
            tooltip="Để trống hệ thống sẽ tự tạo từ tên"
          >
            <Input placeholder="tin-tuc-tai-chinh" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
