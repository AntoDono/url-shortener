import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Result, Button, Spin } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Skip if already verified
      if (hasVerified.current) return;
      
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        const response = await fetch(`${API_URL}/verify-email/${token}`);
        const data = await response.json();

        if (response.ok) {
          hasVerified.current = true;
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [location, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Result
        status={status === 'success' ? 'success' : 'error'}
        icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        title={message}
        extra={[
          <Button 
            type="primary" 
            key="login" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>,
          status === 'error' && (
            <Button 
              key="register" 
              onClick={() => navigate('/register')}
            >
              Register Again
            </Button>
          ),
        ].filter(Boolean)}
      />
    </div>
  );
}; 