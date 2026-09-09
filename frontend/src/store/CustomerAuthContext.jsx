// Customer Authentication Context for Vietcombank Customer Portal
import { createContext, useContext, useMemo, useState } from 'react';
import client, { TOKEN_KEY, REFRESH_KEY } from '../api/client';

export const CUSTOMER_USER_KEY = 'vcb_customer_user';
export const CUSTOMER_TOKEN_KEY = 'vcb_customer_token';

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo(() => ({
    customer,
    isCustomerLoggedIn: Boolean(customer && localStorage.getItem(CUSTOMER_TOKEN_KEY)),
    isIndividual: customer?.customerType === 'INDIVIDUAL',
    isEnterprise: customer?.customerType === 'ENTERPRISE',
    loginCustomer: (authResponse) => {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, authResponse.accessToken);
      // Đồng thời gán vào ap_access_token để client axios tự động mang token này khi gửi request
      localStorage.setItem(TOKEN_KEY, authResponse.accessToken);

      const custData = {
        customerId: authResponse.customerId,
        username: authResponse.username,
        fullName: authResponse.fullName,
        customerType: authResponse.customerType,
        email: authResponse.email,
        phoneNumber: authResponse.phoneNumber,
      };
      localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(custData));
      setCustomer(custData);
    },
    logoutCustomer: () => {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      setCustomer(null);
    },
    updateCustomerProfile: (updatedData) => {
      setCustomer((prev) => {
        const next = { ...prev, ...updatedData };
        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(next));
        return next;
      });
    }
  }), [customer]);

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
