import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface MaterialCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category_id: string | null;
  teacher_id: string;
  subject: string;
  upload_date: string;
  last_updated: string;
  downloads: number;
  is_published: boolean;
  category?: MaterialCategory;
  teacher?: {
    full_name: string;
    email: string;
  };
}

interface StudyMaterialState {
  materials: StudyMaterial[];
  categories: MaterialCategory[];
  loading: boolean;
  error: string | null;
  fetchMaterials: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'upload_date' | 'last_updated' | 'downloads'>) => Promise<void>;
  updateMaterial: (id: string, material: Partial<StudyMaterial>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addCategory: (category: Pick<MaterialCategory, 'name' | 'description'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<MaterialCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStudyMaterialStore = create<StudyMaterialState>((set, get) => ({
  materials: [],
  categories: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchMaterials: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('study_materials')
        .select(`
          *,
          category:material_categories(*),
          teacher:teachers(full_name, email)
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      set({ materials: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ categories: data || [] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addMaterial: async (material) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('study_materials')
        .insert([material])
        .select(`
          *,
          category:material_categories(*),
          teacher:teachers(full_name, email)
        `)
        .single();

      if (error) throw error;
      
      const materials = get().materials;
      set({ materials: [data, ...materials] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add study material';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateMaterial: async (id, material) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('study_materials')
        .update(material)
        .eq('id', id)
        .select(`
          *,
          category:material_categories(*),
          teacher:teachers(full_name, email)
        `)
        .single();

      if (error) throw error;

      const materials = get().materials.map(m => 
        m.id === id ? { ...m, ...data } : m
      );
      set({ materials });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update study material';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteMaterial: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const materials = get().materials.filter(m => m.id !== id);
      set({ materials });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete study material';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addCategory: async (category) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('material_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      
      const categories = get().categories;
      set({ categories: [...categories, data] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCategory: async (id, category) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('material_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const categories = get().categories.map(c => 
        c.id === id ? { ...c, ...data } : c
      );
      set({ categories });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteCategory: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('material_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const categories = get().categories.filter(c => c.id !== id);
      set({ categories });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));