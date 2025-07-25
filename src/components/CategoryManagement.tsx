import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Package,
  X,
  AlertCircle,
  Folder,
  FolderOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';
import TenantLayout from './TenantLayout';

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  tenant_id: string;
  created_at: string;
  products_count?: number;
  children?: Category[];
}

const CategoryManagement: React.FC = () => {
  const { currentTenant } = useTenant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: ''
  });

  useEffect(() => {
    if (currentTenant?.id) {
      fetchCategories();
    }
  }, [currentTenant]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Para usuários demo, gerar dados mock
      if (currentTenant?.slug) {
        const mockCategories = generateMockCategories();
        setCategories(mockCategories);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', currentTenant?.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCategories = (): Category[] => {
    const categoryTemplates = {
      'moda-bella': [
        { name: 'Vestidos', description: 'Vestidos para todas as ocasiões', products_count: 12 },
        { name: 'Blusas', description: 'Blusas casuais e sociais', products_count: 8 },
        { name: 'Calças', description: 'Calças jeans, sociais e leggings', products_count: 15 },
        { name: 'Acessórios', description: 'Bolsas, cintos e bijuterias', products_count: 20 },
        { name: 'Sapatos', description: 'Calçados femininos', products_count: 10 }
      ],
      'tech-store-pro': [
        { name: 'Smartphones', description: 'Celulares e acessórios', products_count: 25 },
        { name: 'Notebooks', description: 'Laptops e ultrabooks', products_count: 18 },
        { name: 'Gadgets', description: 'Dispositivos eletrônicos', products_count: 30 },
        { name: 'Gaming', description: 'Produtos para gamers', products_count: 22 },
        { name: 'Acessórios', description: 'Cabos, carregadores e capas', products_count: 45 }
      ],
      'casa-decoracao': [
        { name: 'Móveis', description: 'Móveis para casa', products_count: 35 },
        { name: 'Iluminação', description: 'Luminárias e lâmpadas', products_count: 28 },
        { name: 'Decoração', description: 'Objetos decorativos', products_count: 40 },
        { name: 'Têxtil', description: 'Cortinas, almofadas e tapetes', products_count: 32 },
        { name: 'Cozinha', description: 'Utensílios e eletrodomésticos', products_count: 25 }
      ]
    };

    const templates = categoryTemplates[currentTenant?.slug as keyof typeof categoryTemplates] || categoryTemplates['moda-bella'];
    
    return templates.map((template, index) => ({
      id: `category-${index + 1}`,
      name: template.name,
      description: template.description,
      tenant_id: currentTenant?.id || '',
      created_at: new Date().toISOString(),
      products_count: template.products_count
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedCategory) {
        // Update existing category
        setCategories(prev => prev.map(category => 
          category.id === selectedCategory.id 
            ? { ...category, ...formData }
            : category
        ));
      } else {
        // Create new category
        const newCategory: Category = {
          id: `category-${Date.now()}`,
          tenant_id: currentTenant?.id || '',
          ...formData,
          parent_id: formData.parent_id || undefined,
          created_at: new Date().toISOString(),
          products_count: 0
        };
        setCategories(prev => [...prev, newCategory]);
      }

      // Reset form
      setFormData({ name: '', description: '', parent_id: '' });
      setShowForm(false);
      setSelectedCategory(null);
      
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(prev => prev.filter(category => category.id !== categoryId));
    }
  };

  const filteredCategories = categories.filter(category => {
    const searchLower = searchTerm.toLowerCase();
    return category.name.toLowerCase().includes(searchLower) ||
           category.description?.toLowerCase().includes(searchLower);
  });

  // Organize categories in hierarchy
  const organizeCategories = (cats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and initialize children arrays
    cats.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: organize hierarchy
    cats.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  };

  const hierarchicalCategories = organizeCategories(filteredCategories);

  const renderCategory = (category: Category, level: number = 0) => (
    <React.Fragment key={category.id}>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
            {level > 0 && <div className="w-4 h-4 border-l border-b border-gray-300 mr-2" />}
            {category.children && category.children.length > 0 ? (
              <FolderOpen className="w-5 h-5 text-blue-600 mr-2" />
            ) : (
              <Folder className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
              {category.description && (
                <div className="text-sm text-gray-500">{category.description}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4 text-gray-400" />
            {category.products_count || 0} produtos
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(category.created_at).toLocaleDateString('pt-BR')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(category)}
              className="text-blue-600 hover:text-blue-900"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {category.children?.map(child => renderCategory(child, level + 1))}
    </React.Fragment>
  );

  const totalCategories = categories.length;
  const totalProducts = categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0);
  const categoriesWithProducts = categories.filter(cat => (cat.products_count || 0) > 0).length;

  if (loading) {
    return (
      <TenantLayout title="Categorias" showBackButton={true}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout title="Gestão de Categorias" showBackButton={true}>
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Categorias</p>
                <p className="text-2xl font-bold text-gray-900">{totalCategories}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produtos Categorizados</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Folder className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categorias Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{categoriesWithProducts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">Organize seus produtos em categorias</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setFormData({ name: '', description: '', parent_id: '' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hierarchicalCategories.map(category => renderCategory(category))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria criada'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente ajustar os termos de busca' 
                : 'Comece criando categorias para organizar seus produtos'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeira Categoria
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Eletrônicos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva esta categoria..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria Pai (Opcional)
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Categoria principal</option>
                    {categories
                      .filter(cat => cat.id !== selectedCategory?.id)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione uma categoria pai para criar uma subcategoria
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedCategory ? 'Atualizar' : 'Criar'} Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TenantLayout>
  );
};

export default CategoryManagement;