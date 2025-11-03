import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { authService, AuthUser } from '@/lib/auth';
import { getPermissions, getRoleBadgeVariant, getRoleDescription } from '@/lib/permissions';
import { toast } from 'sonner';

interface UserManagementProps {
  currentUser: User;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'maker' as 'maker' | 'checker' | 'admin',
    name: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    role: 'maker' as 'maker' | 'checker' | 'admin',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const permissions = getPermissions(currentUser, users);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = authService.getUsers(currentUser);
    setUsers(allUsers);
  };

  const addUser = async () => {
    setError('');
    
    if (!newUser.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!newUser.password.trim()) {
      setError('Password is required');
      return;
    }
    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!newUser.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.createUser(
        {
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          name: newUser.name
        },
        currentUser
      );

      if (result.success) {
        toast.success('User created successfully');
        setNewUser({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'maker',
          name: ''
        });
        loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        setError(result.error || 'Failed to create user');
        toast.error(result.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred while creating user');
      toast.error('An error occurred while creating user');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      name: user.name,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      username: '',
      name: '',
      role: 'maker',
      password: '',
      confirmPassword: ''
    });
  };

  const saveEdit = async (userId: string) => {
    setError('');

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (editForm.password && editForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const updates: any = {
        username: editForm.username,
        name: editForm.name,
        role: editForm.role
      };

      if (editForm.password) {
        updates.password = editForm.password;
      }

      const result = await authService.updateUser(userId, updates, currentUser);

      if (result.success) {
        toast.success('User updated successfully');
        setEditingId(null);
        loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (err) {
      toast.error('An error occurred while updating user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.deleteUser(userId, currentUser);

      if (result.success) {
        toast.success('User deleted successfully');
        loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('An error occurred while deleting user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setLoading(true);

    try {
      const result = await authService.updateUser(
        userId,
        { isActive: !user.isActive },
        currentUser
      );

      if (result.success) {
        toast.success(`User \${user.isActive ? 'deactivated' : 'activated'} successfully`);
        loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (err) {
      toast.error('An error occurred while updating user status');
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canViewUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to view or manage users.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {permissions.canCreateUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add New User
            </CardTitle>
            <CardDescription>
              {currentUser.role === 'checker' 
                ? 'As a Checker, you can create Maker accounts' 
                : 'Create new user accounts with appropriate roles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label>Username *</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: 'maker' | 'checker' | 'admin') => setNewUser({ ...newUser, role: value })}
                    disabled={currentUser.role === 'checker'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maker">Maker</SelectItem>
                      {currentUser.role === 'admin' && <SelectItem value="checker">Checker</SelectItem>}
                      {currentUser.role === 'admin' && <SelectItem value="admin">Administrator</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Password * (min 8 characters)</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label>Confirm Password *</Label>
                  <Input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Button 
                  onClick={addUser} 
                  disabled={loading || !newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users List ({users.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {editingId === user.id ? (
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Full name"
                          />
                        ) : (
                          <div className="font-medium">
                            {user.name}
                            {user.id === currentUser.id && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === user.id ? (
                          <Input
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="Username"
                          />
                        ) : (
                          <div className="font-mono text-sm">{user.username}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === user.id ? (
                          <div className="space-y-2">
                            <Select
                              value={editForm.role}
                              onValueChange={(value: 'maker' | 'checker' | 'admin') => 
                                setEditForm({ ...editForm, role: value })
                              }
                              disabled={!permissions.canChangeUserRole(user.role)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maker">Maker</SelectItem>
                                {currentUser.role === 'admin' && <SelectItem value="checker">Checker</SelectItem>}
                                {currentUser.role === 'admin' && <SelectItem value="admin">Administrator</SelectItem>}
                              </SelectContent>
                            </Select>
                            <div className="space-y-1">
                              <Input
                                type="password"
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                placeholder="New password (optional)"
                                autoComplete="new-password"
                              />
                              {editForm.password && (
                                <Input
                                  type="password"
                                  value={editForm.confirmPassword}
                                  onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                                  placeholder="Confirm new password"
                                  autoComplete="new-password"
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{getRoleDescription(user.role)}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {editingId === user.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveEdit(user.id)}
                                disabled={loading}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {permissions.canEditUser(user.id) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(user)}
                                  disabled={loading}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {permissions.canDeactivateUser(user.id) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleUserStatus(user.id)}
                                  disabled={loading}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              )}
                              {permissions.canDeleteUser(user.id) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUser(user.id)}
                                  disabled={loading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
