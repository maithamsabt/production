/**
 * Authentication Service
 * Handles user authentication, password hashing, and session management
 */

// Simple SHA-256 based password hashing (client-side)
// In production, use a proper backend with bcrypt/argon2
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Session management
const SESSION_KEY = 'currentUser';
const LAST_LOGIN_KEY = 'lastLogin';

export interface AuthUser {
  id: string;
  username: string;
  role: 'maker' | 'checker' | 'admin';
  name: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  /**
   * Initialize the auth service and restore session if exists
   */
  async initialize(): Promise<void> {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData) as AuthUser;
        // Verify user still exists and is active
        const users = this.getAllUsers();
        const existingUser = users.find(u => u.id === user.id);
        if (existingUser && existingUser.isActive) {
          this.currentUser = user;
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.logout();
      }
    }
  }

  /**
   * Get all users from storage
   */
  private getAllUsers(): StoredUser[] {
    const usersData = localStorage.getItem('users');
    if (!usersData) return [];
    try {
      return JSON.parse(usersData);
    } catch {
      return [];
    }
  }

  /**
   * Save users to storage
   */
  private saveUsers(users: StoredUser[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  }

  /**
   * Get user by username
   */
  private getUserByUsername(username: string): StoredUser | undefined {
    const users = this.getAllUsers();
    return users.find(u => u.username === username);
  }

  /**
   * Authenticate user with username and password
   */
  async login(username: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      const user = this.getUserByUsername(username);
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is deactivated' };
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Update last login
      const users = this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].lastLogin = new Date().toISOString();
        this.saveUsers(users);
      }

      // Create session
      const authUser: AuthUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: new Date().toISOString()
      };

      this.currentUser = authUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString());

      return { success: true, user: authUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Get current logged-in user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Create a new user (requires admin or checker role for the creator)
   */
  async createUser(
    userData: {
      username: string;
      password: string;
      role: 'maker' | 'checker' | 'admin';
      name: string;
    },
    createdBy: AuthUser
  ): Promise<{ success: boolean; user?: StoredUser; error?: string }> {
    try {
      // Check permissions
      if (createdBy.role === 'maker') {
        return { success: false, error: 'Makers cannot create users' };
      }

      if (createdBy.role === 'checker' && userData.role !== 'maker') {
        return { success: false, error: 'Checkers can only create maker accounts' };
      }

      // Validate input
      if (!userData.username.trim()) {
        return { success: false, error: 'Username is required' };
      }

      if (!userData.password.trim()) {
        return { success: false, error: 'Password is required' };
      }

      if (userData.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      if (!userData.name.trim()) {
        return { success: false, error: 'Name is required' };
      }

      // Check if username already exists
      if (this.getUserByUsername(userData.username)) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const newUser: StoredUser = {
        id: crypto.randomUUID(),
        username: userData.username,
        passwordHash,
        role: userData.role,
        name: userData.name,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Save user
      const users = this.getAllUsers();
      users.push(newUser);
      this.saveUsers(users);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'An error occurred while creating user' };
    }
  }

  /**
   * Update user (requires appropriate permissions)
   */
  async updateUser(
    userId: string,
    updates: {
      username?: string;
      password?: string;
      role?: 'maker' | 'checker' | 'admin';
      name?: string;
      isActive?: boolean;
    },
    updatedBy: AuthUser
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const users = this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      const targetUser = users[userIndex];

      // Permission checks
      if (updatedBy.role === 'maker') {
        // Makers can only update their own profile (name only)
        if (userId !== updatedBy.id) {
          return { success: false, error: 'Insufficient permissions' };
        }
        if (updates.role || updates.isActive || updates.username) {
          return { success: false, error: 'Makers can only update their own name' };
        }
      }

      if (updatedBy.role === 'checker') {
        // Checkers can update makers and themselves
        if (targetUser.role === 'admin' || targetUser.role === 'checker') {
          if (userId !== updatedBy.id) {
            return { success: false, error: 'Checkers cannot modify admin or other checker accounts' };
          }
        }
        // Checkers cannot promote users to admin or checker
        if (updates.role && updates.role !== 'maker') {
          return { success: false, error: 'Checkers cannot assign admin or checker roles' };
        }
      }

      // Admin cannot deactivate themselves
      if (userId === updatedBy.id && updates.isActive === false) {
        return { success: false, error: 'Cannot deactivate your own account' };
      }

      // Apply updates
      if (updates.username) {
        // Check if new username already exists
        if (users.some(u => u.username === updates.username && u.id !== userId)) {
          return { success: false, error: 'Username already exists' };
        }
        users[userIndex].username = updates.username;
      }

      if (updates.password) {
        if (updates.password.length < 8) {
          return { success: false, error: 'Password must be at least 8 characters' };
        }
        users[userIndex].passwordHash = await hashPassword(updates.password);
      }

      if (updates.role) {
        users[userIndex].role = updates.role;
      }

      if (updates.name) {
        users[userIndex].name = updates.name;
      }

      if (updates.isActive !== undefined) {
        users[userIndex].isActive = updates.isActive;
      }

      this.saveUsers(users);

      // If current user was updated, update session
      if (userId === updatedBy.id) {
        const updatedAuthUser: AuthUser = {
          id: users[userIndex].id,
          username: users[userIndex].username,
          role: users[userIndex].role,
          name: users[userIndex].name,
          isActive: users[userIndex].isActive,
          createdAt: users[userIndex].createdAt,
          lastLogin: users[userIndex].lastLogin
        };
        this.currentUser = updatedAuthUser;
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedAuthUser));
      }

      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'An error occurred while updating user' };
    }
  }

  /**
   * Delete user (admin only, cannot delete self)
   */
  async deleteUser(userId: string, deletedBy: AuthUser): Promise<{ success: boolean; error?: string }> {
    try {
      if (deletedBy.role !== 'admin') {
        return { success: false, error: 'Only administrators can delete users' };
      }

      if (userId === deletedBy.id) {
        return { success: false, error: 'Cannot delete your own account' };
      }

      const users = this.getAllUsers();
      const filteredUsers = users.filter(u => u.id !== userId);

      if (filteredUsers.length === users.length) {
        return { success: false, error: 'User not found' };
      }

      this.saveUsers(filteredUsers);
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'An error occurred while deleting user' };
    }
  }

  /**
   * Get all users (as AuthUser, without password hash)
   */
  getUsers(requestedBy: AuthUser): AuthUser[] {
    // Only admin and checker can view all users
    if (requestedBy.role === 'maker') {
      // Makers can only see themselves
      return [{
        id: requestedBy.id,
        username: requestedBy.username,
        role: requestedBy.role,
        name: requestedBy.name,
        isActive: requestedBy.isActive,
        createdAt: requestedBy.createdAt,
        lastLogin: requestedBy.lastLogin
      }];
    }

    const users = this.getAllUsers();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      name: u.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin
    }));
  }

  /**
   * Initialize default admin user
   */
  async initializeAdminUser(username: string, password: string): Promise<void> {
    const users = this.getAllUsers();
    
    // Check if admin already exists
    const adminExists = users.some(u => u.role === 'admin');
    if (adminExists) {
      return;
    }

    const passwordHash = await hashPassword(password);

    const adminUser: StoredUser = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      role: 'admin',
      name: 'System Administrator',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(adminUser);
    this.saveUsers(users);
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export utility functions
export { hashPassword, verifyPassword };
