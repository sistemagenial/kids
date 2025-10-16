
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import Input from '../../components/base/Input';
import Header from '../../components/feature/Header';
import { useToastContext } from '../../contexts/ToastContext';
import type { User, Story } from '../../lib/database';

// Tipos auxiliares
type FilterType = 'all' | 'active' | 'expiring' | 'expired' | 'basic' | 'pro' | 'premium';
type SortField = 'name' | 'email' | 'plan' | 'days';
type SortOrder = 'asc' | 'desc';

// ✅ CORREÇÃO: Tipos para vídeos e pedidos
interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  order_number: number;
  created_at: string;
  is_new: boolean;
  testament: 'old' | 'new';
}

interface PurchaseOrder {
  id: string;
  name: string;
  email: string;
  cpf: string;
  whatsapp: string;
  plan: string;
  status: string;
  created_at: string;
  user_created_at?: string;
  notes?: string;
  planDetails?: {
    name: string;
    devices: number;
    price: string;
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();

  // Tabs
  const [activeTab, setActiveTab] = useState('users');

  // Dados principais
  const [users, setUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Estados de usuário
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Estados de história
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [storySearchTerm, setStorySearchTerm] = useState('');
  const [storyFilterType, setStoryFilterType] = useState<'all' | 'old' | 'new' | 'novidades'>('all');
  const [storyFormData, setStoryFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    pdf_url: '', // ✅ CORRIGIDO: Campo PDF já existe
    order_number: 1,
    is_new: true,
    testament: 'old'
  });

  // ✅ CORREÇÃO: Estados para vídeos
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [videoSearchTerm, setVideoSearchTerm] = useState('');
  const [videoFilterType, setVideoFilterType] = useState<'all' | 'old' | 'new' | 'novidades'>('all');
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    order_number: 1,
    is_new: true,
    testament: 'old'
  });

  // ✅ CORREÇÃO: Estados para pedidos
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderFilterType, setOrderFilterType] = useState<'all' | 'pending' | 'paid' | 'user_created'>('all');
  const [orderFormData, setOrderFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    whatsapp: '',
    plan: 'basic',
    status: 'pending',
    notes: ''
  });

  // Formulário de usuário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    whatsapp: '',
    license_count: 1,
    access_expires_at: ''
  });

  // Alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // -------------------------------------------------------------------------
  // 1️⃣ Efeitos iniciais
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Verifica se o usuário logado é admin
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }

    try {
      const raw = JSON.parse(stored);
// garante boolean consistente mesmo que venha "0"/"1"
const parsed = { ...raw, is_admin: Number(raw.is_admin) === 1 };

if (parsed.is_admin) {
  setAdminUser(parsed);
  fetchData();
} else {
  navigate('/inicio');
}
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  // -------------------------------------------------------------------------
  // 2️⃣ Funções de carregamento
  // -------------------------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchStories(), fetchVideos(), fetchOrders()]);
    } catch (e) {
      console.error(e);
      error('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users.php?action=all');
      const json = await res.json();
      if (json.data) {
        const normalized = json.data.map((u: any) => ({
  ...u,
  id: String(u.id),
  license_count: Number(u.license_count),
  is_admin: Number(u.is_admin) === 1, // ⬅️ aqui está a diferença
}));
        setUsers(normalized);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories.php?action=all');
      const json = await res.json();
      if (json.data) {
        const normalized = json.data.map((s: any) => ({
          ...s,
          order_number: Number(s.order_number),
          is_new: Boolean(s.is_new),
          id: String(s.id)
        }));
        setStories(normalized);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ CORREÇÃO: Função para buscar vídeos do banco MySQL
  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos.php?action=all');
      const json = await res.json();
      if (json.data) {
        const normalized = json.data.map((v: any) => ({
          ...v,
          order_number: Number(v.order_number),
          is_new: Boolean(v.is_new),
          id: String(v.id)
        }));
        setVideos(normalized);
      }
    } catch (e) {
      console.error('Erro ao buscar vídeos:', e);
    }
  };

  // ✅ CORREÇÃO: Função para buscar pedidos do banco MySQL
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders.php?action=all');
      const json = await res.json();
      if (json.data) {
        const normalized = json.data.map((o: any) => ({
          ...o,
          id: String(o.id)
        }));
        setOrders(normalized);
      }
    } catch (e) {
      console.error('Erro ao buscar pedidos:', e);
    }
  };

  // -------------------------------------------------------------------------
  // 3️⃣ Helpers
  // -------------------------------------------------------------------------
  const getPlanName = (count: number) => {
    switch (count) {
      case 1:
        return 'BÁSICO';
      case 3:
        return 'PRO';
      case 5:
        return 'PREMIUM';
      default:
        return 'BÁSICO';
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (days: number) =>
    days <= 0
      ? 'bg-red-100 text-red-800'
      : days <= 30
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800';

  const getStatusText = (days: number) =>
    days <= 0 ? 'Expirado' : days <= 30 ? 'Expirando' : 'Ativo';

  // -------------------------------------------------------------------------
  // 4️⃣ Seleção / Ordenação de usuários
  // -------------------------------------------------------------------------
  const handleUserSelect = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const sortUsers = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredSortedUsers = () => {
    let list = users.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.cpf || '').includes(userSearchTerm) ||
        getPlanName(u.license_count).toLowerCase().includes(userSearchTerm.toLowerCase());

      if (!matchSearch) return false;

      const days = getDaysRemaining(u.access_expires_at);
      switch (filterType) {
        case 'active':
          return days > 30 && !u.is_admin;
        case 'expiring':
          return days > 0 && days <= 30 && !u.is_admin;
        case 'expired':
          return days <= 0 && !u.is_admin;
        case 'basic':
          return u.license_count === 1;
        case 'pro':
          return u.license_count === 3;
        case 'premium':
          return u.license_count === 5;
        default:
          return true;
      }
    });

    list.sort((a, b) => {
      let av: any, bv: any;
      switch (sortField) {
        case 'name':
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case 'email':
          av = a.email.toLowerCase();
          bv = b.email.toLowerCase();
          break;
        case 'plan':
          av = getPlanName(a.license_count);
          bv = getPlanName(b.license_count);
          break;
        case 'days':
          av = getDaysRemaining(a.access_expires_at);
          bv = getDaysRemaining(b.access_expires_at);
          break;
        default:
          av = '';
          bv = '';
      }
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  };

  // -------------------------------------------------------------------------
  // 5️⃣ Handlers de usuário (CRUD)
  // -------------------------------------------------------------------------
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      cpf: user.cpf || '',
      whatsapp: user.whatsapp || '',
      license_count: user.license_count,
      access_expires_at: user.access_expires_at
    });
  };

  const resetUserForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      whatsapp: '',
      license_count: 1,
      access_expires_at: ''
    });
  };

  const handleCreateNewUser = () => {
    setSelectedUser(null);
    resetUserForm();
  };

  const handleSaveUser = async () => {
    try {
      const url = selectedUser ? '/api/users.php?action=update' : '/api/users.php?action=create';
      const method = selectedUser ? 'PUT' : 'POST';
      const payload = selectedUser ? { ...formData, id: selectedUser.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        success('Sucesso', selectedUser ? 'Usuário atualizado!' : 'Usuário criado!');
        setSelectedUser(null);
        resetUserForm();
        fetchUsers();
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao salvar usuário');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao salvar usuário');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users.php?action=delete&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Sucesso', 'Usuário excluído!');
        fetchUsers();
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao excluir usuário');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao excluir usuário');
    }
  };

  const handleRenewUser = async (id: string) => {
    try {
      const res = await fetch('/api/users.php?action=update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, access_expires_at: 'renew' })
      });
      if (res.ok) {
        success('Sucesso', 'Usuário renovado por 1 ano!');
        fetchUsers();
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao renovar');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao renovar usuário');
    }
  };

  // -------------------------------------------------------------------------
  // 6️⃣ Story handling
  // -------------------------------------------------------------------------
  const handleStorySelect = (id: string) => {
    setSelectedStories(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetStoryForm = () => {
    setStoryFormData({
      title: '',
      content: '',
      image_url: '',
      pdf_url: '', // ✅ CORRIGIDO: Resetar campo PDF também
      order_number: stories.length + 1,
      is_new: true,
      testament: 'old'
    });
  };

  const getFilteredStories = () => {
    return stories
      .filter(st => {
        const match = st.title.toLowerCase().includes(storySearchTerm.toLowerCase());
        if (!match) return false;
        switch (storyFilterType) {
          case 'old':
            return st.testament === 'old';
          case 'new':
            return st.testament === 'new';
          case 'novidades':
            return st.is_new;
          default:
            return true;
        }
      })
      .sort((a, b) => a.order_number - b.order_number);
  };

  const handleDeleteStory = async (id: string) => {
    try {
      const res = await fetch(`/api/stories.php?action=delete&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Sucesso', 'História excluída!');
        fetchStories();
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao excluir história');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao excluir história');
    }
  };

  // ✅ CORREÇÃO: Handlers para vídeos
  const handleVideoSelect = (id: string) => {
    setSelectedVideos(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      order_number: videos.length + 1,
      is_new: true,
      testament: 'old'
    });
  };

  const getFilteredVideos = () => {
    return videos
      .filter(v => {
        const match = v.title.toLowerCase().includes(videoSearchTerm.toLowerCase());
        if (!match) return false;
        switch (videoFilterType) {
          case 'old':
            return v.testament === 'old';
          case 'new':
            return v.testament === 'new';
          case 'novidades':
            return v.is_new;
          default:
            return true;
        }
      })
      .sort((a, b) => a.order_number - b.order_number);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const res = await fetch(`/api/videos.php?action=delete&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Sucesso', 'Vídeo excluído!');
        fetchVideos();
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao excluir vídeo');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao excluir vídeo');
    }
  };

  // ✅ CORREÇÃO: Handlers para pedidos
  const handleOrderSelect = (id: string) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetOrderForm = () => {
    setOrderFormData({
      name: '',
      email: '',
      cpf: '',
      whatsapp: '',
      plan: 'basic',
      status: 'pending',
      notes: ''
    });
  };

  const getFilteredOrders = () => {
    return orders
      .filter(o => {
        const match =
          o.name.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          o.email.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
          (o.cpf || '').includes(orderSearchTerm);
        if (!match) return false;
        switch (orderFilterType) {
          case 'pending':
            return o.status === 'pending';
          case 'paid':
            return o.status === 'paid';
          case 'user_created':
            return o.status === 'user_created';
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // -------------------------------------------------------------------------
  // 9️⃣ Logout & Password
  // -------------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('Erro', 'As senhas não coincidem');
      return;
    }
    try {
      const res = await fetch('/api/users.php?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      if (res.ok) {
        success('Sucesso', 'Senha alterada!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await res.json();
        error('Erro', err.error || 'Falha ao alterar senha');
      }
    } catch (e) {
      console.error(e);
      error('Erro', 'Falha ao alterar senha');
    }
  };

  // -------------------------------------------------------------------------
  // 10️⃣ Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient">
      <Header user={adminUser} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
            <p className="text-gray-600">Gerencie usuários, histórias, vídeos e pedidos</p>
          </div>
          <Button
            onClick={() => setShowPasswordModal(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-4 py-2"
          >
            <i className="ri-lock-line mr-2"></i>Alterar Senha
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'users', label: 'Usuários', icon: 'ri-user-line', colors: 'from-blue-500 to-blue-6' },
            { id: 'stories', label: 'Histórias', icon: 'ri-book-line', colors: 'from-green-500 to-green-6' },
            { id: 'videos', label: 'Vídeos', icon: 'ri-video-line', colors: 'from-red-500 to-red-6' },
            { id: 'orders', label: 'Pedidos', icon: 'ri-shopping-cart-line', colors: 'from-purple-500 to-purple-6' }
          ].map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-bold px-6 py-3 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.colors} text-white shadow-lg`
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Backup / Restore */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={async () => {
              try {
                const res = await fetch('/api/backup.php?action=create', { method: 'POST' });
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  success('Sucesso', 'Backup criado e baixado.');
                } else {
                  error('Erro', 'Falha ao criar backup');
                }
              } catch (e) {
                console.error(e);
                error('Erro', 'Falha ao criar backup');
              }
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-4 py-2"
          >
            <i className="ri-download-cloud-line mr-2"></i>Fazer Backup
          </Button>

          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.sql';
              input.onchange = async e => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('backup', file);
                try {
                  const res = await fetch('/api/backup.php?action=restore', {
                    method: 'POST',
                    body: form
                  });
                  if (res.ok) {
                    success('Sucesso', 'Backup restaurado.');
                    fetchData();
                  } else {
                    error('Erro', 'Falha ao restaurar backup');
                  }
                } catch (err) {
                  console.error(err);
                  error('Erro', 'Falha ao restaurar backup');
                }
              };
              input.click();
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-4 py-2"
          >
            <i className="ri-upload-cloud-line mr-2"></i>Restaurar Backup
          </Button>
        </div>

        {/* ==================== USERS TAB ==================== */}
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Listagem */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Lista de Usuários</h2>
                  <Button
                    onClick={handleCreateNewUser}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-4 py-2"
                  >
                    <i className="ri-add-line mr-2"></i>Criar Usuário
                  </Button>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, email, CPF ou plano..."
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-sm bg-white shadow-lg"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as FilterType)}
                    className="appearance-none bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-6 py-3 pr-10 rounded-xl shadow-lg"
                  >
                    <option value="all" className="bg-white text-gray-800">TODOS</option>
                    <option value="active" className="bg-white text-gray-800">ATIVOS</option>
                    <option value="expiring" className="bg-white text-gray-800">EXPIRANDO</option>
                    <option value="expired" className="bg-white text-gray-800">EXPIRADO</option>
                    <option value="basic" className="bg-white text-gray-800">BÁSICO</option>
                    <option value="pro" className="bg-white text-gray-800">PRO</option>
                    <option value="premium" className="bg-white text-gray-800">PREMIUM</option>
                  </select>
                </div>

                {/* ✅ CORREÇÃO: Ações em lote ABAIXO do campo de busca */}
                {selectedUsers.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedUsers.length} usuário(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (window.confirm(`Excluir ${selectedUsers.length} usuários?`)) {
                            for (const id of selectedUsers) {
                              await handleDeleteUser(id);
                            }
                            setSelectedUsers([]);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 py-1 text-sm"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>Excluir
                      </Button>
                      <Button
                        onClick={async () => {
                          if (window.confirm(`Renovar ${selectedUsers.length} usuários por 1 ano?`)) {
                            for (const id of selectedUsers) {
                              await handleRenewUser(id);
                            }
                            setSelectedUsers([]);
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-3 py-1 text-sm"
                      >
                        <i className="ri-refresh-line mr-1"></i>Renovar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-2">
                          <input
                            type="checkbox"
                            checked={
                              selectedUsers.length > 0 &&
                              selectedUsers.length === filteredSortedUsers().filter(u => !u.is_admin).length
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedUsers(
                                  filteredSortedUsers()
                                    .filter(u => !u.is_admin)
                                    .map(u => u.id)
                                );
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => sortUsers('name')}>
                          Nome {sortField === 'name' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line ml-1`}></i>}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => sortUsers('email')}>
                          Email {sortField === 'email' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line ml-1`}></i>}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => sortUsers('plan')}>
                          Plano {sortField === 'plan' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line ml-1`}></i>}
                        </th>
                        <th className="p-2 cursor-pointer" onClick={() => sortUsers('days')}>
                          Dias Restantes {sortField === 'days' && <i className={`ri-arrow-${sortOrder === 'asc' ? 'up' : 'down'}-line ml-1`}></i>}
                        </th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSortedUsers().map(user => {
                        const days = user.is_admin ? 999999 : getDaysRemaining(user.access_expires_at);
                        return (
                          <tr
                            key={user.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              selectedUser?.id === user.id ? 'bg-blue-50' : ''
                            } ${user.is_admin ? 'bg-yellow-50' : ''}`}
                            onClick={() => handleUserClick(user)}
                          >
                            <td className="p-2 text-center">
                              {user.is_admin ? (
                                <i className="ri-vip-crown-fill text-yellow-500 text-xl"></i>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={e => {
                                    e.stopPropagation();
                                    handleUserSelect(user.id);
                                  }}
                                  className="rounded"
                                />
                              )}
                            </td>
                            <td className="p-2 text-center font-medium text-gray-800">
                              {user.name}
                              {user.is_admin && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  ADMIN
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center text-gray-600">{user.email}</td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {getPlanName(user.license_count)}
                              </span>
                            </td>
                            <td className="p-2 text-center font-bold">
                              {user.is_admin ? (
                                <span className="text-yellow-600">∞</span>
                              ) : (
                                <span className={days <= 0 ? 'text-red-600' : days <= 30 ? 'text-yellow-600' : 'text-green-600'}>
                                  {days}
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              {user.is_admin ? (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  Admin
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(days)}`}>
                                  {getStatusText(days)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Formulário de usuário */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedUser ? 'Editar Usuário' : 'Criar Usuário'}
                  </h3>
                  <Button
                    onClick={handleCreateNewUser}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-3 py-2 text-sm"
                  >
                    <i className="ri-add-line mr-1"></i>Novo
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                    <select
                      value={formData.license_count}
                      onChange={e => setFormData({ ...formData, license_count: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value={1}>BÁSICO (1 dispositivo)</option>
                      <option value={3}>PRO (3 dispositivos)</option>
                      <option value={5}>PREMIUM (5 dispositivos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Expiração</label>
                    <Input
                      type="datetime-local"
                      value={formData.access_expires_at ? new Date(formData.access_expires_at).toISOString().slice(0, 16) : ''}
                      onChange={e => setFormData({ ...formData, access_expires_at: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveUser}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2"
                    >
                      <i className="ri-save-line mr-2"></i>
                      {selectedUser ? 'Salvar Alterações' : 'Criar Usuário'}
                    </Button>

                    {selectedUser && !selectedUser.is_admin && (
                      <Button
                        onClick={() => {
                          if (window.confirm('Excluir este usuário?')) {
                            handleDeleteUser(selectedUser.id);
                            setSelectedUser(null);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </Button>
                    )}
                  </div>

                  {selectedUser && !selectedUser.is_admin && (
                    <Button
                      onClick={() => {
                        if (window.confirm('Renovar usuário por 1 ano?')) {
                          handleRenewUser(selectedUser.id);
                        }
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2"
                    >
                      <i className="ri-refresh-line mr-2"></i>Renovar 1 Ano
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== STORIES TAB ==================== */}
        {activeTab === 'stories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de histórias */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Lista de Histórias</h2>
                  <Button
                    onClick={() => {
                      setSelectedStory(null);
                      resetStoryForm();
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-4 py-2"
                  >
                    <i className="ri-add-line mr-2"></i>Criar História
                  </Button>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar histórias..."
                      value={storySearchTerm}
                      onChange={e => setStorySearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-all text-sm bg-white shadow-lg"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <select
                    value={storyFilterType}
                    onChange={e => setStoryFilterType(e.target.value as typeof storyFilterType)}
                    className="appearance-none bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-6 py-3 pr-10 rounded-xl shadow-lg"
                  >
                    <option value="all" className="bg-white text-gray-800">TODOS</option>
                    <option value="new" className="bg-white text-gray-800">NOVO TESTAMENTO</option>
                    <option value="old" className="bg-white text-gray-800">VELHO TESTAMENTO</option>
                    <option value="novidades" className="bg-white text-gray-800">NOVIDADES</option>
                  </select>
                </div>

                {/* ✅ CORREÇÃO: Ações em lote ABAIXO do campo de busca */}
                {selectedStories.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">
                      {selectedStories.length} história(s) selecionada(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (window.confirm(`Excluir ${selectedStories.length} histórias?`)) {
                            for (const id of selectedStories) {
                              await handleDeleteStory(id);
                            }
                            setSelectedStories([]);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 py-1 text-sm"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>Excluir
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStories.length > 0 && selectedStories.length === getFilteredStories().length}
                            onChange={e => {
                              if (e.target.checked) setSelectedStories(getFilteredStories().map(s => s.id));
                              else setSelectedStories([]);
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-center">Ordem</th>
                        <th className="p-2 text-center">Título</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-center">Criado</th>
                        <th className="p-2 text-center">Imagem</th>
                        <th className="p-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStories().map(story => (
                        <tr
                          key={story.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            selectedStory?.id === story.id ? 'bg-green-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedStory(story);
                            setStoryFormData({
                              title: story.title,
                              content: story.content,
                              image_url: story.image_url || '',
                              pdf_url: story.pdf_url || '', // ✅ CORRIGIDO: Carregar PDF URL também
                              order_number: story.order_number,
                              is_new: story.is_new || false,
                              testament: story.testament || 'old'
                            });
                          }}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStories.includes(story.id)}
                              onChange={() => handleStorySelect(story.id)}
                              onClick={e => e.stopPropagation()}
                              className="rounded"
                            />
                          </td>
                          <td className="p-2 text-center font-bold text-blue-600">{story.order_number}</td>
                          <td className="p-2 text-center font-medium text-gray-800">{story.title}</td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                story.is_new ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {story.is_new ? 'Novo' : 'Antigo'}
                            </span>
                          </td>
                          <td className="p-2 text-center text-gray-600">{new Date(story.created_at).toLocaleDateString()}</td>
                          <td className="p-2 text-center">
                            {story.image_url ? (
                              <img src={story.image_url} alt={story.title} className="h-12 w-12 object-cover rounded" />
                            ) : (
                              <span className="text-gray-400">Sem imagem</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedStory(story);
                                setStoryFormData({
                                  title: story.title,
                                  content: story.content,
                                  image_url: story.image_url || '',
                                  pdf_url: story.pdf_url || '', // ✅ CORRIGIDO: Carregar PDF URL também
                                  order_number: story.order_number,
                                  is_new: story.is_new || false,
                                  testament: story.testament || 'old'
                                });
                              }}
                              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-2 py-1 text-sm"
                            >
                              <i className="ri-edit-line"></i>
                            </Button>
                            <Button
                              onClick={e => {
                                e.stopPropagation();
                                if (window.confirm('Excluir história?')) handleDeleteStory(story.id);
                              }}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-2 py-1 text-sm ml-2"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Formulário de histórias */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedStory ? 'Editar História' : 'Criar História'}
                  </h3>
                  <Button
                    onClick={() => {
                      setSelectedStory(null);
                      resetStoryForm();
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-3 py-2 text-sm"
                  >
                    <i className="ri-add-line mr-1"></i>Novo
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testamento</label>
                    <select
                      value={storyFormData.testament}
                      onChange={e => setStoryFormData({ ...storyFormData, testament: e.target.value as 'old' | 'new' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="old">VELHO TESTAMENTO</option>
                      <option value="new">NOVO TESTAMENTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <Input
                      id="title"
                      value={storyFormData.title}
                      onChange={e => setStoryFormData({ ...storyFormData, title: e.target.value })}
                      placeholder="Título da história"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                    <textarea
                      value={storyFormData.content}
                      onChange={e => setStoryFormData({ ...storyFormData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows={8}
                      placeholder="Conteúdo em HTML"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Imagem URL</label>
                    <Input
                      id="image_url"
                      value={storyFormData.image_url}
                      onChange={e => setStoryFormData({ ...storyFormData, image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">PDF URL</label>
                    <Input
                      id="pdf_url"
                      value={storyFormData.pdf_url}
                      onChange={e => setStoryFormData({ ...storyFormData, pdf_url: e.target.value })}
                      placeholder="https://exemplo.com/historia.pdf"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Link do arquivo PDF para download da história
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                    <Input
                      type="number"
                      id="order_number"
                      value={storyFormData.order_number}
                      onChange={e => setStoryFormData({ ...storyFormData, order_number: Number(e.target.value) })}
                      min={1}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_new"
                      checked={storyFormData.is_new}
                      onChange={e => setStoryFormData({ ...storyFormData, is_new: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="is_new" className="ml-2 text-sm font-medium text-gray-700">
                      Marcar como Novidade?
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={async () => {
                        try {
                          const url = selectedStory
                            ? `/api/stories.php?action=update&id=${selectedStory.id}`
                            : '/api/stories.php?action=create';
                          const method = selectedStory ? 'PUT' : 'POST';
                          const payload = selectedStory
                            ? { ...storyFormData, id: selectedStory.id }
                            : storyFormData;

                          const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });

                          if (res.ok) {
                            success('Sucesso', selectedStory ? 'História atualizada!' : 'História criada!');
                            setSelectedStory(null);
                            resetStoryForm();
                            await fetchStories();
                          } else {
                            const err = await res.json();
                            error('Erro', err.error || 'Falha ao salvar história');
                          }
                        } catch (e) {
                          console.error(e);
                          error('Erro', 'Falha ao salvar história');
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2"
                    >
                      <i className="ri-save-line mr-2"></i>
                      {selectedStory ? 'Salvar Alterações' : 'Criar História'}
                    </Button>

                    {selectedStory && (
                      <Button
                        onClick={() => {
                          if (window.confirm('Excluir esta história?')) {
                            handleDeleteStory(selectedStory.id);
                            setSelectedStory(null);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== VIDEOS TAB ==================== */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de vídeos */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Lista de Vídeos</h2>
                  <Button
                    onClick={() => {
                      setSelectedVideo(null);
                      resetVideoForm();
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2"
                  >
                    <i className="ri-add-line mr-2"></i>Criar Vídeo
                  </Button>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar vídeos..."
                      value={videoSearchTerm}
                      onChange={e => setVideoSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-all text-sm bg-white shadow-lg"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <select
                    value={videoFilterType}
                    onChange={e => setVideoFilterType(e.target.value as typeof videoFilterType)}
                    className="appearance-none bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-6 py-3 pr-10 rounded-xl shadow-lg"
                  >
                    <option value="all" className="bg-white text-gray-800">TODOS</option>
                    <option value="new" className="bg-white text-gray-800">NOVO TESTAMENTO</option>
                    <option value="old" className="bg-white text-gray-800">VELHO TESTAMENTO</option>
                    <option value="novidades" className="bg-white text-gray-800">NOVIDADES</option>
                  </select>
                </div>

                {/* ✅ CORREÇÃO: Ações em lote ABAIXO do campo de busca */}
                {selectedVideos.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-red-800">
                      {selectedVideos.length} vídeo(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (window.confirm(`Excluir ${selectedVideos.length} vídeos?`)) {
                            for (const id of selectedVideos) {
                              await handleDeleteVideo(id);
                            }
                            setSelectedVideos([]);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 py-1 text-sm"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>Excluir
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedVideos.length > 0 && selectedVideos.length === getFilteredVideos().length}
                            onChange={e => {
                              if (e.target.checked) setSelectedVideos(getFilteredVideos().map(v => v.id));
                              else setSelectedVideos([]);
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-center">Ordem</th>
                        <th className="p-2 text-center">Título</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-center">Criado</th>
                        <th className="p-2 text-center">Thumbnail</th>
                        <th className="p-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredVideos().length === 0 ? (
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 text-center" colSpan={7}>
                            <div className="text-center py-8">
                              <i className="ri-video-line text-4xl text-gray-400 mb-2"></i>
                              <p className="text-gray-500">Nenhum vídeo encontrado</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getFilteredVideos().map(video => (
                          <tr
                            key={video.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              selectedVideo?.id === video.id ? 'bg-red-50' : ''
                            }`}
                            onClick={() => {
                              setSelectedVideo(video);
                              setVideoFormData({
                                title: video.title,
                                description: video.description,
                                video_url: video.video_url,
                                thumbnail_url: video.thumbnail_url || '',
                                order_number: video.order_number,
                                is_new: video.is_new || false,
                                testament: video.testament || 'old'
                              });
                            }}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedVideos.includes(video.id)}
                                onChange={() => handleVideoSelect(video.id)}
                                onClick={e => e.stopPropagation()}
                                className="rounded"
                              />
                            </td>
                            <td className="p-2 text-center font-bold text-blue-600">{video.order_number}</td>
                            <td className="p-2 text-center font-medium text-gray-800">{video.title}</td>
                            <td className="p-2 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  video.is_new ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {video.is_new ? 'Novo' : 'Antigo'}
                              </span>
                            </td>
                            <td className="p-2 text-center text-gray-600">{new Date(video.created_at).toLocaleDateString()}</td>
                            <td className="p-2 text-center">
                              {video.thumbnail_url ? (
                                <img src={video.thumbnail_url} alt={video.title} className="h-12 w-12 object-cover rounded" />
                              ) : (
                                <span className="text-gray-400">Sem thumbnail</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedVideo(video);
                                  setVideoFormData({
                                    title: video.title,
                                    description: video.description,
                                    video_url: video.video_url,
                                    thumbnail_url: video.thumbnail_url || '',
                                    order_number: video.order_number,
                                    is_new: video.is_new || false,
                                    testament: video.testament || 'old'
                                  });
                                }}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-2 py-1 text-sm"
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              <Button
                                onClick={e => {
                                  e.stopPropagation();
                                  if (window.confirm('Excluir vídeo?')) handleDeleteVideo(video.id);
                                }}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-2 py-1 text-sm ml-2"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Formulário de vídeos */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedVideo ? 'Editar Vídeo' : 'Criar Vídeo'}
                  </h3>
                  <Button
                    onClick={() => {
                      setSelectedVideo(null);
                      resetVideoForm();
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 py-2 text-sm"
                  >
                    <i className="ri-add-line mr-1"></i>Novo
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testamento</label>
                    <select
                      value={videoFormData.testament}
                      onChange={e => setVideoFormData({ ...videoFormData, testament: e.target.value as 'old' | 'new' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="old" className="bg-white text-gray-800">VELHO TESTAMENTO</option>
                      <option value="new" className="bg-white text-gray-800">NOVO TESTAMENTO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input
                      type="text"
                      placeholder="Título do vídeo"
                      value={videoFormData.title}
                      onChange={e => setVideoFormData({ ...videoFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows={4}
                      placeholder="Descrição do vídeo"
                      value={videoFormData.description}
                      onChange={e => setVideoFormData({ ...videoFormData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL do Vídeo</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoFormData.video_url}
                      onChange={e => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/thumbnail.jpg"
                      value={videoFormData.thumbnail_url}
                      onChange={e => setVideoFormData({ ...videoFormData, thumbnail_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                    <input
                      type="number"
                      min={1}
                      value={videoFormData.order_number}
                      onChange={e => setVideoFormData({ ...videoFormData, order_number: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_new_video"
                      checked={videoFormData.is_new}
                      onChange={e => setVideoFormData({ ...videoFormData, is_new: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="is_new_video" className="ml-2 text-sm font-medium text-gray-700">
                      Marcar como Novidade?
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={async () => {
                        try {
                          const url = selectedVideo
                            ? `/api/videos.php?action=update`
                            : '/api/videos.php?action=create';
                          const method = selectedVideo ? 'PUT' : 'POST';
                          const payload = selectedVideo
                            ? { ...videoFormData, id: selectedVideo.id }
                            : videoFormData;

                          const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });

                          if (res.ok) {
                            success('Sucesso', selectedVideo ? 'Vídeo atualizado!' : 'Vídeo criado!');
                            setSelectedVideo(null);
                            resetVideoForm();
                            await fetchVideos();
                          } else {
                            const err = await res.json();
                            error('Erro', err.error || 'Falha ao salvar vídeo');
                          }
                        } catch (e) {
                          console.error(e);
                          error('Erro', 'Falha ao salvar vídeo');
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2"
                    >
                      <i className="ri-save-line mr-2"></i>
                      {selectedVideo ? 'Salvar Alterações' : 'Criar Vídeo'}
                    </Button>

                    {selectedVideo && (
                      <Button
                        onClick={() => {
                          if (window.confirm('Excluir este vídeo?')) {
                            handleDeleteVideo(selectedVideo.id);
                            setSelectedVideo(null);
                          }
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 py-2"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== ORDERS TAB ==================== */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de pedidos */}
            <div className="lg:col-span-2">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Lista de Pedidos</h2>
                  <Button
                    onClick={() => {
                      setSelectedOrder(null);
                      resetOrderForm();
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-4 py-2"
                  >
                    <i className="ri-add-line mr-2"></i>Novo Pedido
                  </Button>
                </div>

                {/* Filtros */}
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Pesquisar pedidos..."
                      value={orderSearchTerm}
                      onChange={e => setOrderSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all text-sm bg-white shadow-lg"
                    />
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <select
                    value={orderFilterType}
                    onChange={e => setOrderFilterType(e.target.value as typeof orderFilterType)}
                    className="appearance-none bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold px-6 py-3 pr-10 rounded-xl shadow-lg"
                  >
                    <option value="all" className="bg-white text-gray-800">TODOS</option>
                    <option value="pending" className="bg-white text-gray-800">PENDENTE</option>
                    <option value="paid" className="bg-white text-gray-800">PAGO</option>
                    <option value="user_created" className="bg-white text-gray-800">USUÁRIO CRIADO</option>
                  </select>
                </div>

                {/* ✅ CORREÇÃO: Ações em lote ABAIXO do campo de busca */}
                {selectedOrders.length > 0 && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-purple-800">
                      {selectedOrders.length} pedido(s) selecionado(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (window.confirm(`Marcar ${selectedOrders.length} pedidos como PAGO?`)) {
                            for (const id of selectedOrders) {
                              try {
                                await fetch('/api/orders.php?action=update-status', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id, status: 'paid' })
                                });
                              } catch (e) {
                                console.error(e);
                              }
                            }
                            setSelectedOrders([]);
                            fetchOrders();
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-3 py-1 text-sm"
                      >
                        <i className="ri-check-line mr-1"></i>Marcar Pago
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedOrders.length > 0 && selectedOrders.length === getFilteredOrders().length}
                            onChange={e => {
                              if (e.target.checked) setSelectedOrders(getFilteredOrders().map(o => o.id));
                              else setSelectedOrders([]);
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-center">Nome</th>
                        <th className="p-2 text-center">Email</th>
                        <th className="p-2 text-center">Plano</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-center">Data</th>
                        <th className="p-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredOrders().length === 0 ? (
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2 text-center" colSpan={7}>
                            <div className="text-center py-8">
                              <i className="ri-shopping-cart-line text-4xl text-gray-400 mb-2"></i>
                              <p className="text-gray-500">Nenhum pedido encontrado</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getFilteredOrders().map(order => (
                          <tr
                            key={order.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              selectedOrder?.id === order.id ? 'bg-purple-50' : ''
                            }`}
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderFormData({
                                name: order.name,
                                email: order.email,
                                cpf: order.cpf || '',
                                whatsapp: order.whatsapp || '',
                                plan: order.plan,
                                status: order.status,
                                notes: order.notes || ''
                              });
                            }}
                          >
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={() => handleOrderSelect(order.id)}
                                onClick={e => e.stopPropagation()}
                                className="rounded"
                              />
                            </td>
                            <td className="p-2 text-center font-medium text-gray-800">{order.name}</td>
                            <td className="p-2 text-center text-gray-600">{order.email}</td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {order.planDetails?.name || order.plan.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {order.status === 'pending'
                                  ? 'PENDENTE'
                                  : order.status === 'paid'
                                  ? 'PAGO'
                                  : 'USUÁRIO CRIADO'}
                              </span>
                            </td>
                            <td className="p-2 text-center text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="p-2 text-center">
                              <Button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setOrderFormData({
                                    name: order.name,
                                    email: order.email,
                                    cpf: order.cpf || '',
                                    whatsapp: order.whatsapp || '',
                                    plan: order.plan,
                                    status: order.status,
                                    notes: order.notes || ''
                                  });
                                }}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold px-2 py-1 text-sm"
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              {order.status === 'paid' && (
                                <Button
                                  onClick={async e => {
                                    e.stopPropagation();
                                    if (window.confirm('Criar usuário a partir deste pedido?')) {
                                      try {
                                        const res = await fetch('/api/orders.php?action=create-user-from-order', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ order_id: order.id })
                                        });
                                        if (res.ok) {
                                          success('Sucesso', 'Usuário criado com sucesso!');
                                          fetchOrders();
                                          fetchUsers();
                                        } else {
                                          const err = await res.json();
                                          error('Erro', err.error || 'Falha ao criar usuário');
                                        }
                                      } catch (e) {
                                        console.error(e);
                                        error('Erro', 'Falha ao criar usuário');
                                      }
                                    }
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-7

text-white font-bold px-2 py-1 text-sm ml-2"
                                >
                                  <i className="ri-user-add-line"></i>
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Formulário de pedidos */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 sticky top-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedOrder ? 'Detalhes do Pedido' : 'Novo Pedido'}
                  </h3>
                  <Button
                    onClick={() => {
                      setSelectedOrder(null);
                      resetOrderForm();
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold px-3 py-2 text-sm"
                  >
                    <i className="ri-add-line mr-1"></i>Novo
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={orderFormData.name}
                      onChange={e => setOrderFormData({ ...orderFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={orderFormData.email}
                      onChange={e => setOrderFormData({ ...orderFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={orderFormData.cpf}
                      onChange={e => setOrderFormData({ ...orderFormData, cpf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={orderFormData.whatsapp}
                      onChange={e => setOrderFormData({ ...orderFormData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
                    <select
                      value={orderFormData.plan}
                      onChange={e => setOrderFormData({ ...orderFormData, plan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="basic" className="bg-white text-gray-800">BÁSICO (1 dispositivo)</option>
                      <option value="pro" className="bg-white text-gray-800">PRO (3 dispositivos)</option>
                      <option value="premium" className="bg-white text-gray-800">PREMIUM (5 dispositivos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={orderFormData.status}
                      onChange={e => setOrderFormData({ ...orderFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="pending" className="bg-white text-gray-800">PENDENTE</option>
                      <option value="paid" className="bg-white text-gray-800">PAGO</option>
                      <option value="user_created" className="bg-white text-gray-800">USUÁRIO CRIADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea
                      placeholder="Observações sobre o pedido..."
                      value={orderFormData.notes}
                      onChange={e => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={async () => {
                        try {
                          const url = selectedOrder
                            ? '/api/orders.php?action=update-status'
                            : '/api/orders.php?action=create';
                          const method = selectedOrder ? 'PUT' : 'POST';
                          const payload = selectedOrder
                            ? { ...orderFormData, id: selectedOrder.id }
                            : orderFormData;

                          const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          });

                          if (res.ok) {
                            success('Sucesso', selectedOrder ? 'Pedido atualizado!' : 'Pedido criado!');
                            setSelectedOrder(null);
                            resetOrderForm();
                            await fetchOrders();
                          } else {
                            const err = await res.json();
                            error('Erro', err.error || 'Falha ao salvar pedido');
                          }
                        } catch (e) {
                          console.error(e);
                          error('Erro', 'Falha ao salvar pedido');
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-2"
                    >
                      <i className="ri-save-line mr-2"></i>
                      {selectedOrder ? 'Salvar Alterações' : 'Criar Pedido'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== MODAL: ALTERAR SENHA ==================== */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Senha Atual</label>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nova Senha</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2"
                >
                  Salvar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
