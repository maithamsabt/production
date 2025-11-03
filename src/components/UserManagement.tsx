import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Users, Edit, Trash2, Save, X, AlertCircle, Power, PowerOff } from 'lucide-react';
import { authService } from '@/lib/auth';
import type { User } from '@/lib/types';
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

  const loadUsers = async () => {
    try {
      const usersData = await authService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
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

    // Check permissions
    if (!permissions.canManageUsers) {
      toast.error('You do not have permission to create users');
      return;
    }

    if (currentUser.role === 'checker' && newUser.role !== 'maker') {
      toast.error('Checkers can only create maker accounts');
      return;
    }

    setLoading(true);

    try {
      await authService.createUser(
        newUser.username,
        newUser.password,
        newUser.role,
        newUser.name
      );

      toast.success('User created successfully');
      setNewUser({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'maker',
        name: ''
      });
      setError('');
      await loadUsers();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create user';
      setError(errorMsg);
      toast.error(errorMsg);
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

      await authService.updateUser(userId, updates);
      toast.success('User updated successfully');
      setEditingId(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
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
      await authService.deleteUser(userId);
      toast.success('User deleted successfully');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);

    try {
      await authService.updateUser(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
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

  // Filter users based on current user's role
  const displayedUsers = users.filter(user => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'checker') return user.role === 'maker';
    return user.id === currentUser.id;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      {/* Add New User Form */}
      {permissions.canManageUsers && (
        <Card>
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
            <CardDescription>Create a new user account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-name">Full Name</Label>
                  <Input
                    id="new-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password (min 8 characters)"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-confirm-password">Confirm Password</Label>
                  <Input
                    id="new-confirm-password"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                    disabled={loading || currentUser.role === 'checker'}
                  >
                    <SelectTrigger id="new-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentUser.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                      {currentUser.role === 'admin' && <SelectItem value="checker">Checker</SelectItem>}
                      <SelectItem value="maker">Maker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={addUser} disabled={loading} className="w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedUsers.map((user) => (
                <TableRow key={user.id}>
                  {editingId === user.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          disabled={loading}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          disabled={loading}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editForm.role}
                          onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}
                          disabled={loading || currentUser.role !== 'admin'}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentUser.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                            {currentUser.role === 'admin' && <SelectItem value="checker">Checker</SelectItem>}
                            <SelectItem value="maker">Maker</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <div className="space-y-2">
                          <Input
                            type="password"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            placeholder="New password (optional)"
                            disabled={loading}
                            className="h-8"
                          />
                          <Input
                            type="password"
                            value={editForm.confirmPassword}
                            onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                            placeholder="Confirm password"
                            disabled={loading}
                            className="h-8"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" onClick={() => saveEdit(user.id)} disabled={loading}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} disabled={loading}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {permissions.canManageUsers && user.id !== currentUser.id && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEdit(user)}
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                disabled={loading}
                              >
                                {user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
                              {currentUser.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
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
                    </>
                  )}
                </TableRow>
              ))}
              {displayedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
