import { Card, Empty } from 'antd';

/** Trang tạm cho các route chưa implement (các phase sau thay dần). */
export default function PlaceholderPage() {
  return (
    <Card>
      <Empty description="Chức năng đang được xây dựng — xem docs/IMPLEMENTATION_PLAN.md" />
    </Card>
  );
}
