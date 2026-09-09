import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

import './index.css';
import App from './App';

dayjs.locale('vi');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#00482B', // Màu xanh thương hiệu Vietcombank chuẩn
          colorSuccess: '#73B828', // Màu xanh lá mạ VCB
          colorWarning: '#E67E22',
          colorError: '#E74C3C',
          colorInfo: '#005030',
          colorBgBase: '#FFFFFF',
          colorTextBase: '#1C252E',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 38,
            fontWeight: 600,
          },
          Card: {
            borderRadiusLG: 12,
            headerFontSize: 16,
            headerFontWeight: 700,
          },
          Table: {
            borderRadius: 10,
            headerBg: '#F8FAFC',
            headerColor: '#00482B',
          },
          Menu: {
            itemBorderRadius: 8,
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(115, 184, 40, 0.25)',
            darkItemSelectedColor: '#FFFFFF',
          },
          Input: {
            controlHeight: 38,
            borderRadius: 8,
          },
          Select: {
            controlHeight: 38,
            borderRadius: 8,
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
