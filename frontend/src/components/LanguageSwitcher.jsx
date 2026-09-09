import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../store/LanguageContext';

export default function LanguageSwitcher({ size = 'middle', style = {}, type = 'default' }) {
  const { lang, setLang, t } = useLanguage();

  const items = [
    {
      key: 'vi',
      label: (
        <Space size={8} style={{ fontWeight: lang === 'vi' ? 'bold' : 'normal' }}>
          <span>🇻🇳</span>
          <span>Tiếng Việt (VI)</span>
        </Space>
      ),
      onClick: () => setLang('vi'),
    },
    {
      key: 'en',
      label: (
        <Space size={8} style={{ fontWeight: lang === 'en' ? 'bold' : 'normal' }}>
          <span>🇬🇧</span>
          <span>English (EN)</span>
        </Space>
      ),
      onClick: () => setLang('en'),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
      <Button
        type={type}
        size={size}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600,
          borderRadius: 6,
          ...style,
        }}
      >
        <GlobalOutlined />
        <span>{lang === 'vi' ? '🇻🇳 VN' : '🇬🇧 EN'}</span>
      </Button>
    </Dropdown>
  );
}
