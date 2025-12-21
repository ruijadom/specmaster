// Email Templates for SpecMaster
// Usage: import { welcomeEmail, confirmationEmail, alertEmail } from '../_shared/email-templates.ts'

const baseStyles = `
  body { 
    margin: 0; 
    padding: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', sans-serif; 
    background-color: #0f0f14;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .wrapper { 
    background-color: #0f0f14; 
    padding: 40px 20px; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #18181d;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .header { 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    padding: 48px 40px; 
    text-align: center;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  }
  .logo { 
    color: #ffffff; 
    margin: 0 0 8px; 
    font-size: 24px; 
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header h1 { 
    color: #ffffff; 
    margin: 0; 
    font-size: 28px; 
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  .header p { 
    color: rgba(255,255,255,0.85); 
    margin: 12px 0 0; 
    font-size: 15px;
    font-weight: 400;
  }
  .content { 
    padding: 40px; 
    color: #e4e4e7;
  }
  .content h2 { 
    color: #fafafa; 
    margin: 0 0 24px; 
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  .content p { 
    color: #a1a1aa; 
    line-height: 1.7; 
    margin: 0 0 16px; 
    font-size: 15px; 
  }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%); 
    color: #ffffff !important; 
    text-decoration: none; 
    padding: 14px 32px; 
    border-radius: 8px; 
    font-weight: 600; 
    font-size: 15px; 
    margin: 24px 0;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }
  .button:hover { 
    background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
    transform: translateY(-1px);
  }
  .footer { 
    background-color: #0f0f14; 
    padding: 32px 40px; 
    text-align: center;
    border-top: 1px solid #27272a;
  }
  .footer p { 
    color: #71717a; 
    font-size: 13px; 
    margin: 0 0 8px;
    line-height: 1.6;
  }
  .footer a { 
    color: #A78BFA; 
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .footer a:hover {
    color: #8B5CF6;
  }
  .divider { 
    height: 1px; 
    background: linear-gradient(90deg, transparent, #27272a, transparent);
    margin: 32px 0; 
  }
  .info-box { 
    background-color: rgba(139, 92, 246, 0.1); 
    border-left: 3px solid #8B5CF6; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .info-box p { color: #d4d4d8; }
  .info-box ul { 
    margin: 12px 0 0; 
    padding-left: 20px; 
    color: #d4d4d8; 
  }
  .info-box li { margin: 8px 0; }
  .alert-box { 
    background-color: rgba(239, 68, 68, 0.1); 
    border-left: 3px solid #ef4444; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .alert-box p { color: #fca5a5; }
  .success-box { 
    background-color: rgba(34, 197, 94, 0.1); 
    border-left: 3px solid #22c55e; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .success-box p { color: #86efac; }
  .warning-box { 
    background-color: rgba(245, 158, 11, 0.1); 
    border-left: 3px solid #f59e0b; 
    padding: 20px 24px; 
    margin: 24px 0; 
    border-radius: 0 8px 8px 0;
  }
  .warning-box p { color: #fcd34d; }
  strong { color: #fafafa; font-weight: 600; }
  .text-gradient {
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #60A5FA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }
`;

const baseLayout = (content: string, headerTitle: string, headerSubtitle?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">specmaster</div>
        <h1>${headerTitle}</h1>
        ${headerSubtitle ? `<p>${headerSubtitle}</p>` : ''}
      </div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} SpecMaster. All rights reserved.</p>
        <p><a href="https://specmaster.app">specmaster.app</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Welcome Email Template
export interface WelcomeEmailOptions {
  userName: string;
  loginUrl?: string;
}

export const welcomeEmail = (options: WelcomeEmailOptions): string => {
  const { userName, loginUrl = 'https://specmaster.app/auth' } = options;
  
  const content = `
    <div class="content">
      <h2>Hello, ${userName}! 👋</h2>
      <p>Welcome to <span class="text-gradient">SpecMaster</span>! We're thrilled to have you with us.</p>
      <p>SpecMaster is the ideal platform to manage your projects intelligently and efficiently with the power of 5 AI agents working in harmony.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 12px;"><strong>What you can do:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Create and manage projects with structured methodology</li>
          <li>Collaborate with specialized AI agents</li>
          <li>Generate documentation automatically</li>
          <li>Integrate with Jira and Linear</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Access My Account</a>
      </p>
      
      <div class="divider"></div>
      
      <p style="color: #71717a; font-size: 14px;">If you have any questions, our team is ready to help you.</p>
      <p style="margin-top: 24px;"><strong>Happy building!</strong><br/>SpecMaster Team</p>
    </div>
  `;
  
  return baseLayout(content, 'Welcome!', 'Your account has been created successfully');
};

// Confirmation Email Template
export interface ConfirmationEmailOptions {
  userName: string;
  confirmationType: 'email' | 'action' | 'subscription' | 'project';
  confirmationUrl?: string;
  details?: string;
  expiresIn?: string;
}

export const confirmationEmail = (options: ConfirmationEmailOptions): string => {
  const { 
    userName, 
    confirmationType, 
    confirmationUrl, 
    details,
    expiresIn = '24 horas'
  } = options;
  
  const titles: Record<string, { title: string; subtitle: string; message: string }> = {
    email: {
      title: 'Confirm Your Email',
      subtitle: 'Account verification',
      message: 'To activate your account, we need to confirm your email address.'
    },
    action: {
      title: 'Confirm Your Action',
      subtitle: 'Confirmation required',
      message: 'An important action was requested on your account.'
    },
    subscription: {
      title: 'Subscription Confirmed',
      subtitle: 'Welcome to premium plan',
      message: 'Your subscription has been processed successfully!'
    },
    project: {
      title: 'Project Created',
      subtitle: 'Creation confirmation',
      message: 'Your new project has been created successfully.'
    }
  };
  
  const config = titles[confirmationType] || titles.action;
  
  const content = `
    <div class="content">
      <h2>Hello, ${userName}!</h2>
      <p>${config.message}</p>
      
      ${details ? `
        <div class="success-box">
          <p style="margin: 0;">${details}</p>
        </div>
      ` : ''}
      
      ${confirmationUrl ? `
        <p style="text-align: center;">
          <a href="${confirmationUrl}" class="button">Confirm Now</a>
        </p>
        
        <p style="font-size: 13px; color: #71717a; text-align: center; margin-top: 16px;">
          This link expires in <strong style="color: #a1a1aa;">${expiresIn}</strong>
        </p>
      ` : ''}
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #71717a;">
        If you didn't request this action, please ignore this email or contact us.
      </p>
    </div>
  `;
  
  return baseLayout(content, config.title, config.subtitle);
};

// Alert Email Template
export interface AlertEmailOptions {
  userName: string;
  alertType: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  details?: string[];
}

export const alertEmail = (options: AlertEmailOptions): string => {
  const { 
    userName, 
    alertType, 
    title, 
    message, 
    actionUrl, 
    actionText = 'View Details',
    details 
  } = options;
  
  const alertStyles: Record<string, { boxClass: string; icon: string }> = {
    info: { boxClass: 'info-box', icon: 'ℹ️' },
    warning: { boxClass: 'warning-box', icon: '⚠️' },
    error: { boxClass: 'alert-box', icon: '🚨' },
    success: { boxClass: 'success-box', icon: '✅' }
  };
  
  const style = alertStyles[alertType] || alertStyles.info;
  
  const content = `
    <div class="content">
      <h2>${style.icon} ${title}</h2>
      <p>Hello, ${userName}!</p>
      <p>${message}</p>
      
      ${details && details.length > 0 ? `
        <div class="${style.boxClass}">
          <ul style="margin: 0; padding-left: 20px;">
            ${details.map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${actionUrl ? `
        <p style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </p>
      ` : ''}
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #71717a;">
        This is an automatic notification from SpecMaster.
      </p>
    </div>
  `;
  
  return baseLayout(content, 'Notification', title);
};

// Password Reset Email Template
export interface PasswordResetEmailOptions {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
}

export const passwordResetEmail = (options: PasswordResetEmailOptions): string => {
  const { userName, resetUrl, expiresIn = '1 hour' } = options;
  
  const content = `
    <div class="content">
      <h2>Reset Password 🔐</h2>
      <p>Hello, ${userName}!</p>
      <p>We received a request to reset the password for your SpecMaster account.</p>
      
      <div class="warning-box">
        <p style="margin: 0;">
          <strong>Important:</strong> If you didn't request this change, ignore this email.
        </p>
      </div>
      
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset My Password</a>
      </p>
      
      <p style="font-size: 13px; color: #71717a; text-align: center; margin-top: 16px;">
        This link expires in <strong style="color: #a1a1aa;">${expiresIn}</strong>
      </p>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #71717a;">
        For security, never share this link with anyone.
      </p>
    </div>
  `;
  
  return baseLayout(content, 'Password Recovery', 'Reset your access password');
};

// Waitlist Email Template
export interface WaitlistEmailOptions {
  email: string;
  position?: number;
}

export const waitlistEmail = (options: WaitlistEmailOptions): string => {
  const { email, position } = options;
  
  const content = `
    <div class="content">
      <p>Hello!</p>
      <p>We're excited to have you with us! Get ready to experience the power of <span class="text-gradient">SpecMaster</span>.</p>
      
      ${position ? `
        <div class="success-box">
          <p style="margin: 0; font-size: 20px; text-align: center; font-weight: 600;">
            You're #${position} in line!
          </p>
        </div>
      ` : ''}
      
      <div class="info-box">
        <p style="margin: 0 0 12px;"><strong>What to expect:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Early access before public launch</li>
          <li>5 specialized AI agents working in harmony</li>
          <li>Automatically generated documentation</li>
          <li>Integrations with Jira and Linear</li>
        </ul>
      </div>
      
      <p>We'll notify you as soon as SpecMaster is ready. Stay tuned to your email!</p>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #71717a;">
        This email was sent to <strong style="color: #a1a1aa;">${email}</strong> because you signed up for the SpecMaster waitlist.
      </p>
    </div>
  `;
  
  return baseLayout(content, 'You\'re on the Waitlist!', 'Thank you for joining us');
};

// Project Update Email Template
export interface ProjectUpdateEmailOptions {
  userName: string;
  projectName: string;
  updateType: 'created' | 'updated' | 'completed' | 'archived';
  projectUrl?: string;
  changes?: string[];
}

export const projectUpdateEmail = (options: ProjectUpdateEmailOptions): string => {
  const { userName, projectName, updateType, projectUrl, changes } = options;
  
  const updateMessages: Record<string, { title: string; message: string; icon: string }> = {
    created: { 
      title: 'New Project Created', 
      message: `The project <strong>"${projectName}"</strong> has been created successfully.`,
      icon: '🚀'
    },
    updated: { 
      title: 'Project Updated', 
      message: `The project <strong>"${projectName}"</strong> has been updated.`,
      icon: '📝'
    },
    completed: { 
      title: 'Project Completed', 
      message: `Congratulations! The project <strong>"${projectName}"</strong> has been marked as completed.`,
      icon: '✅'
    },
    archived: { 
      title: 'Project Archived', 
      message: `The project <strong>"${projectName}"</strong> has been archived.`,
      icon: '📦'
    }
  };
  
  const config = updateMessages[updateType] || updateMessages.updated;
  
  const content = `
    <div class="content">
      <h2>${config.icon} ${config.title}</h2>
      <p>Hello, ${userName}!</p>
      <p>${config.message}</p>
      
      ${changes && changes.length > 0 ? `
        <div class="info-box">
          <p style="margin: 0 0 12px;"><strong>Changes:</strong></p>
          <ul style="margin: 0; padding-left: 20px;">
            ${changes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${projectUrl ? `
        <p style="text-align: center;">
          <a href="${projectUrl}" class="button">View Project</a>
        </p>
      ` : ''}
      
      <div class="divider"></div>
      
      <p style="color: #71717a; font-size: 14px;">Keep tracking your projects on SpecMaster!</p>
    </div>
  `;
  
  return baseLayout(content, config.title, `Update for project "${projectName}"`);
};
