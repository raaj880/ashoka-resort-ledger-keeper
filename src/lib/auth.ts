import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  role: {
    id: string;
    role_name: string;
    permissions: Record<string, boolean>;
    description?: string;
  };
  is_active: boolean;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  private updateState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.notify();
  }

  async initialize() {
    this.updateState({ isLoading: true });
    
    try {
      const sessionToken = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (sessionToken && userData) {
        try {
          const user = JSON.parse(userData);
          this.updateState({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
    
    this.updateState({ user: null, isAuthenticated: false, isLoading: false });
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Simple authentication - check for default credentials
      if (username === 'admin' && password === 'ashoka123') {
        const adminUser: User = {
          id: 'admin-default',
          username: 'admin',
          full_name: 'System Administrator',
          role: {
            id: 'admin-role',
            role_name: 'admin',
            permissions: { all: true },
            description: 'Full system access'
          },
          is_active: true
        };
        
        const sessionToken = this.generateSessionToken();
        localStorage.setItem('auth_token', sessionToken);
        localStorage.setItem('user_data', JSON.stringify(adminUser));
        
        this.updateState({ user: adminUser, isAuthenticated: true });
        toast.success('Welcome to Ashoka Resort Dashboard!');
        return true;
      }

      // Try to authenticate with database
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select(`
            *,
            role:user_roles(*)
          `)
          .eq('username', username)
          .eq('is_active', true)
          .single();

        if (error || !users) {
          toast.error('Invalid credentials. Please try again.');
          return false;
        }

        // For now, we'll use simple password check (in production, use proper hashing)
        const isValidPassword = password === 'ashoka123' || password === 'admin123';
        
        if (!isValidPassword) {
          toast.error('Invalid credentials. Please try again.');
          return false;
        }

        const user: User = {
          id: users.id,
          username: users.username,
          email: users.email,
          full_name: users.full_name,
          role: users.role,
          is_active: users.is_active,
          last_login: users.last_login
        };

        const sessionToken = this.generateSessionToken();
        localStorage.setItem('auth_token', sessionToken);
        localStorage.setItem('user_data', JSON.stringify(user));
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', users.id);

        this.updateState({ user, isAuthenticated: true });
        toast.success(`Welcome back, ${user.full_name}!`);
        return true;
      } catch (dbError) {
        console.error('Database authentication error:', dbError);
        // Fall back to simple auth if database is not available
        if (username === 'admin' && password === 'ashoka123') {
          const adminUser: User = {
            id: 'admin-fallback',
            username: 'admin',
            full_name: 'System Administrator',
            role: {
              id: 'admin-role',
              role_name: 'admin',
              permissions: { all: true },
              description: 'Full system access'
            },
            is_active: true
          };
          
          const sessionToken = this.generateSessionToken();
          localStorage.setItem('auth_token', sessionToken);
          localStorage.setItem('user_data', JSON.stringify(adminUser));
          
          this.updateState({ user: adminUser, isAuthenticated: true });
          toast.success('Welcome to Ashoka Resort Dashboard!');
          return true;
        }
      }

      toast.error('Invalid credentials. Please try again.');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  }

  async logout() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      this.updateState({ user: null, isAuthenticated: false });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  hasPermission(permission: string): boolean {
    if (!this.authState.user) return false;
    
    const permissions = this.authState.user.role.permissions;
    return permissions.all === true || permissions[permission] === true;
  }

  getAuthState(): AuthState {
    return this.authState;
  }
}

export const authService = AuthService.getInstance();