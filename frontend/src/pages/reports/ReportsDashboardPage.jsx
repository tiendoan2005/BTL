import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Dropdown,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import client from '../../api/client';
import { extractError } from '../data/ratesHelpers';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const STATUS_COLORS = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  DOCS_REQUIRED: 'blue',
};

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  DOCS_REQUIRED: 'Cần bổ sung',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const TYPE_LABELS = {
  LOAN: 'Vay vốn',
  CARD_ISSUANCE: 'Phát hành thẻ',
  LIMIT_APPROVAL: 'Duyệt hạn mức',
};

const CURRENCY_COLORS = {
  USD: '#1677ff',
  EUR: '#722ed1',
  JPY: '#fa8c16',
  GBP: '#13c2c2',
  SGD: '#eb2f96',
};

/** Đơn vị tiền hiển thị ở trục: rút gọn về triệu/tỷ. */
function fmtCompact(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr`;
  return n.toLocaleString('vi-VN');
}

// ==================== Biểu đồ SVG thuần (không thêm dependency) ====================

/** Cột ngang: phân bố hồ sơ theo trạng thái. */
function StatusBars({ stats }) {
  if (!stats?.length) return <Empty description="Không có dữ liệu" />;
  const max = Math.max(...stats.map((s) => s.count), 1);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {stats.map((s) => (
        <div key={s.status}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Tag color={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status] || s.status}</Tag>
            <Typography.Text strong>{s.count} hồ sơ · {fmtCompact(s.totalAmount)}</Typography.Text>
          </div>
          <div style={{ background: '#f0f2f5', borderRadius: 6, height: 10 }}>
            <div
              style={{
                width: `${Math.max((s.count / max) * 100, 3)}%`,
                height: '100%',
                borderRadius: 6,
                background: `var(--ant-color-${STATUS_COLORS[s.status] || 'blue'})`,
                backgroundColor: STATUS_COLORS[s.status] === 'green' ? '#52c41a'
                  : STATUS_COLORS[s.status] === 'red' ? '#ff4d4f'
                  : STATUS_COLORS[s.status] === 'blue' ? '#1677ff' : '#faad14',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tròn SVG: phân bố theo loại hồ sơ. */
function TypePie({ stats }) {
  const total = (stats || []).reduce((sum, s) => sum + s.count, 0);
  if (!total) return <Empty description="Không có dữ liệu" />;
  const palette = ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1'];
  let angle = -90;
  const slices = stats.map((s, i) => {
    const sweep = (s.count / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const rad = (deg) => ((deg * Math.PI) / 180);
    const x1 = 80 + 70 * Math.cos(rad(start));
    const y1 = 80 + 70 * Math.sin(rad(start));
    const x2 = 80 + 70 * Math.cos(rad(end));
    const y2 = 80 + 70 * Math.sin(rad(end));
    const large = sweep > 180 ? 1 : 0;
    return {
      key: s.type, count: s.count, label: TYPE_LABELS[s.type] || s.type,
      path: `M 80 80 L ${x1} ${y1} A 70 70 0 ${large} 1 ${x2} ${y2} Z`,
      color: palette[i % palette.length],
    };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices.map((sl) => (
          <path key={sl.key} d={sl.path} fill={sl.color} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <div>
        {slices.map((sl) => (
          <div key={sl.key} style={{ marginBottom: 6 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: 2,
              background: sl.color, marginRight: 8,
            }} />
            <Typography.Text>{sl.label}: </Typography.Text>
            <Typography.Text strong>{sl.count}</Typography.Text>
            <Typography.Text type="secondary"> ({Math.round((sl.count / total) * 100)}%)</Typography.Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cột dọc SVG: doanh số duyệt theo tháng. */
function MonthlyChart({ months }) {
  if (!months?.length) return <Empty description="Không có dữ liệu duyệt trong kỳ" />;
  const maxAmount = Math.max(...months.map((m) => Number(m.totalAmount || 0)), 1);
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', height: 200, padding: '8px 4px' }}>
      {months.map((m) => {
        const h = Math.max((Number(m.totalAmount || 0) / maxAmount) * 160, 6);
        return (
          <div key={m.month} style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Text style={{ fontSize: 12 }}>{fmtCompact(m.totalAmount)}</Typography.Text>
            <div style={{
              margin: '4px auto', width: 44, height: h, borderRadius: '6px 6px 0 0',
              background: 'linear-gradient(180deg,#1677ff,#69b1ff)',
            }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {m.month.slice(0, 7)} · {m.count} HS
            </Typography.Text>
          </div>
        );
      })}
    </div>
  );
}

/** Line chart SVG nhiều đường: xu hướng tỷ giá theo ngày. */
function RateTrendChart({ points }) {
  const series = useMemo(() => {
    const map = new Map();
    for (const p of points || []) {
      if (!map.has(p.currencyCode)) map.set(p.currencyCode, []);
      map.get(p.currencyCode).push(p);
    }
    return [...map.entries()];
  }, [points]);

  if (!series.length) return <Empty description="Không có dữ liệu tỷ giá trong kỳ" />;

  const W = 720; const H = 220; const PAD_L = 56; const PAD_R = 16; const PAD_T = 16; const PAD_B = 34;
  const allDates = [...new Set(points.map((p) => p.date))].sort();
  const allRates = points.map((p) => Number(p.sellRate));
  const minR = Math.min(...allRates);
  const maxR = Math.max(...allRates);
  const span = maxR - minR || 1;
  const x = (date) => PAD_L + (allDates.indexOf(date) / Math.max(allDates.length - 1, 1)) * (W - PAD_L - PAD_R);
  const y = (rate) => PAD_T + (1 - (rate - minR) / span) * (H - PAD_T - PAD_B);

  // Nhãn trục Y: 4 vạch chia
  const ticks = [0, 1 / 3, 2 / 3, 1].map((t) => minR + t * span);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={H} role="img">
        {ticks.map((tv, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tv)} y2={y(tv)} stroke="#eee" />
            <text x={PAD_L - 6} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="#888">
              {tv.toLocaleString('vi-VN')}
            </text>
          </g>
        ))}
        {series.map(([code, pts]) => (
          <g key={code}>
            <polyline
              fill="none"
              stroke={CURRENCY_COLORS[code] || '#1677ff'}
              strokeWidth="2"
              points={pts.map((p) => `${x(p.date)},${y(Number(p.sellRate))}`).join(' ')}
            />
            {pts.map((p) => (
              <circle key={`${p.date}-${p.currencyCode}`} cx={x(p.date)} cy={y(Number(p.sellRate))}
                r="3.5" fill="#fff" stroke={CURRENCY_COLORS[code] || '#1677ff'} strokeWidth="2">
                <title>{`${p.date} · ${p.currencyCode}: ${Number(p.sellRate).toLocaleString('vi-VN')}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {allDates.map((d, i) => (
          (allDates.length <= 8 || i % Math.ceil(allDates.length / 8) === 0) && (
            <text key={d} x={x(d)} y={H - 10} textAnchor="middle" fontSize="11" fill="#888">
              {d.slice(5)}
            </text>
          )
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {series.map(([code]) => (
          <span key={code} style={{ fontSize: 13 }}>
            <span style={{
              display: 'inline-block', width: 16, height: 3, verticalAlign: 'middle',
              marginRight: 6, background: CURRENCY_COLORS[code] || '#1677ff',
            }} />
            <Typography.Text strong>{code}</Typography.Text>
          </span>
        ))}
      </div>
    </div>
  );
}

// ==================== Trang chính ====================

/** Trang Báo cáo & thống kê: dashboard + xuất Excel/PDF/CSV + lịch sử xuất. */
export default function ReportsDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState([dayjs().startOf('month'), dayjs()]);
  const [type, setType] = useState(undefined);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastExport, setLastExport] = useState(null); // {downloadUrl, format}

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (range?.[0]) params.from = range[0].format('YYYY-MM-DD');
      if (range?.[1]) params.to = range[1].format('YYYY-MM-DD');
      if (type) params.type = type;
      setDashboard(await client.get('/reports/dashboard', { params }).then((r) => r.data.data));
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [range, type]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await client.get('/reports/history', { params: { page: 0, size: 10 } })
        .then((r) => r.data.data);
      setHistoryRows(data.content || []);
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const doExport = async (format) => {
    setExporting(true);
    try {
      const params = { format };
      if (range?.[0]) params.from = range[0].format('YYYY-MM-DD');
      if (range?.[1]) params.to = range[1].format('YYYY-MM-DD');
      if (type) params.type = type;
      const res = await client.post('/reports/export', null, { params });
      const data = res.data?.data;
      message.success(`Đã tạo file ${format.toLowerCase()} (${data.rowCount} dòng)`);
      setLastExport(data);
      loadHistory();
    } catch (err) {
      message.error(extractError(err));
    } finally {
      setExporting(false);
    }
  };

  const historyColumns = [
    { title: 'Thời điểm', dataIndex: 'exportedAt', width: 150,
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm') },
    { title: 'Loại báo cáo', dataIndex: 'reportType', width: 170 },
    {
      title: 'Định dạng', dataIndex: 'fileFormat', width: 100,
      render: (v) => (
        <Tag color={v === 'EXCEL' ? 'green' : v === 'PDF' ? 'red' : 'blue'}>{v}</Tag>
      ),
    },
    { title: 'Bộ lọc', dataIndex: 'filterParams', ellipsis: true,
      render: (v) => (v && v !== '{}' ? v : '-') },
    {
      title: '', width: 110,
      render: (_, record) => (
        <a href={`${BASE_URL}${record.filePath}`} target="_blank" rel="noreferrer">Tải file</a>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Filter bar */}
      <Card size="small">
        <Space wrap>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => setRange(v)}
            allowClear
            format="DD/MM/YYYY"
          />
          <Select
            placeholder="Loại hồ sơ"
            allowClear
            style={{ minWidth: 170 }}
            value={type}
            onChange={setType}
            options={[
              { value: 'LOAN', label: 'Vay vốn' },
              { value: 'CARD_ISSUANCE', label: 'Phát hành thẻ' },
              { value: 'LIMIT_APPROVAL', label: 'Duyệt hạn mức' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadDashboard}>Làm mới</Button>

          <Dropdown
            menu={{
              items: [
                { key: 'EXCEL', label: 'Excel (.xlsx)' },
                { key: 'PDF', label: 'PDF (.pdf)' },
                { key: 'CSV', label: 'CSV (.csv)' },
              ],
              onClick: ({ key }) => doExport(key),
            }}
          >
            <Button type="primary" loading={exporting} icon={<DownloadOutlined />}>
              Xuất báo cáo
            </Button>
          </Dropdown>
          {lastExport && (
            <Button type="link" href={`${BASE_URL}${lastExport.downloadUrl}`} target="_blank"
              icon={<FileDoneOutlined />}>
              Tải file vừa xuất ({lastExport.format})
            </Button>
          )}
        </Space>
      </Card>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Tổng hồ sơ"
              value={dashboard?.totalApplications ?? 0}
              prefix={<FileDoneOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Chờ xử lý"
              value={dashboard?.pendingCount ?? 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Doanh số đã duyệt (VNĐ)"
              value={Number(dashboard?.approvedAmount ?? 0)}
              precision={0}
              formatter={(v) => fmtCompact(v)}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Theo trạng thái" loading={loading}>
            <StatusBars stats={dashboard?.byStatus} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Theo loại hồ sơ" loading={loading}>
            <TypePie stats={dashboard?.byType} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Doanh số duyệt theo tháng" loading={loading}>
            <MonthlyChart months={dashboard?.monthlyApproved} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Xu hướng tỷ giá bán" extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              USD · EUR · JPY · GBP · SGD
            </Typography.Text>
          } loading={loading}>
            <RateTrendChart points={dashboard?.exchangeRateTrend} />
          </Card>
        </Col>
      </Row>

      {/* Export history */}
      <Card title="Lịch sử xuất báo cáo của tôi">
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={historyRows}
          loading={historyLoading}
          pagination={{ pageSize: 5, hideOnSinglePage: true }}
        />
      </Card>
    </Space>
  );
}
