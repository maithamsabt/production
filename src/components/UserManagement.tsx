import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Users, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { User } from '@/lib/types';

interface UserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  currentUser: User;
}

export default function UserManagement({ users, onUsersChange, currentUser }: UserManagementProps) {
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'maker' as 'maker' | 'checker',
    name: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const addUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()) return;

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      createdAt: new Date().toISOString()
    };

    onUsersChange([...users, user]);
    setNewUser({
      username: '',
      password: '',
      role: 'maker',
      name: '',
      isActive: true
    });
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    onUsersChange(users.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
    setEditingId(null);
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert('Cannot delete your own account');
      return;
    }
    onUsersChange(users.filter(user => user.id !== id));
  };

  const toggleUserStatus = (id: string) => {
    if (id === currentUser.id) {
      alert('Cannot deactivate your own account');
      return;
    }
    onUsersChange(users.map(user => 
      user.id === id ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Add New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: 'maker' | 'checker') => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maker">Maker</SelectItem>
                  <SelectItem value="checker">Checker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={addUser} 
              disabled={!newUser.username.trim() || !newUser.password.trim() || !newUser.name.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users List ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editingId === user.id ? (
                        <Input
                          defaultValue={user.name}
                          onBlur={(e) => updateUser(user.id, { name: e.target.value })}
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
                          defaultValue={user.username}
                          onBlur={(e) => updateUser(user.id, { username: e.target.value })}
                        />
                      ) : (
                        <div className="font-mono text-sm">{user.username}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-sm">
                          {showPasswords[user.id] ? user.password : '••••••••'}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === user.id ? (
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value: 'maker' | 'checker') => updateUser(user.id, { role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maker">Maker</SelectItem>
                            <SelectItem value="checker">Checker</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={user.role === 'checker' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
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
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                          disabled={user.id === currentUser.id}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.id === currentUser.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}