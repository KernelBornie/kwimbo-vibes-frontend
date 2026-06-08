'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error();
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Failed to update role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch {
      alert('Failed to delete user');
    }
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/10">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="bg-white/10 p-1 rounded"
                  >
                    <option value="LISTENER">Listener</option>
                    <option value="ARTIST">Artist</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="bg-red-600 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
