import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../apiClient';
import { Category } from '../../types';
import Spinner from '../../components/Spinner';
import { Icon } from '@iconify/react';

interface CategoriesViewProps {
    showToast: (message: string) => void;
}

const CategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, parentId: string | null) => void;
    category?: Category | null;
    parentCategory?: Category | null;
}> = ({ isOpen, onClose, onSave, category, parentCategory }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(category ? category.name : '');
        }
    }, [isOpen, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), parentCategory ? parentCategory.id : (category ? category.parentId : null));
        }
    };

    if (!isOpen) return null;

    const title = category ? "Редагувати категорію" : (parentCategory ? `Додати підкатегорію до "${parentCategory.name}"` : "Створити нову категорію");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="bg-tg-secondary-bg rounded-lg shadow-xl w-full max-w-md animate-modal-slide-in" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4">
                        <h3 className="text-lg font-bold mb-4">{title}</h3>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Назва категорії"
                            className="w-full bg-tg-bg p-2 mt-1 rounded-lg border border-tg-border focus:ring-2 focus:ring-tg-link focus:outline-none"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-tg-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-tg-secondary-bg-hover rounded-lg">Скасувати</button>
                        <button type="submit" className="px-4 py-2 bg-tg-button text-tg-button-text rounded-lg">Зберегти</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CategoryItem: React.FC<{
    category: Category;
    level: number;
    onAddSubcategory: (parent: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}> = ({ category, level, onAddSubcategory, onEdit, onDelete }) => (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-tg-secondary-bg-hover group">
        <span className="font-medium">{category.name}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onAddSubcategory(category)} title="Додати підкатегорію" className="p-1 text-tg-hint hover:text-tg-link"><Icon icon="lucide:plus" /></button>
            <button onClick={() => onEdit(category)} title="Редагувати" className="p-1 text-tg-hint hover:text-tg-link"><Icon icon="lucide:pencil" /></button>
            <button onClick={() => onDelete(category.id)} title="Видалити" className="p-1 text-tg-hint hover:text-red-400"><Icon icon="lucide:trash-2" /></button>
        </div>
    </div>
);

const CategoryTree: React.FC<{
    categories: Category[];
    parentId?: string | null;
    level?: number;
    onAddSubcategory: (parent: Category) => void;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}> = ({ categories, parentId = null, level = 0, ...rest }) => {
    const childCategories = useMemo(() => categories.filter(c => c.parentId === parentId), [categories, parentId]);
    if (childCategories.length === 0) return null;
    
    return (
        <ul style={{ paddingLeft: level > 0 ? '20px' : '0' }} className="space-y-1">
            {childCategories.map(cat => (
                <li key={cat.id} className="border-l border-tg-border pl-2">
                    <CategoryItem category={cat} level={level} {...rest} />
                    <CategoryTree categories={categories} parentId={cat.id} level={level + 1} {...rest} />
                </li>
            ))}
        </ul>
    );
};

const CategoriesView: React.FC<CategoriesViewProps> = ({ showToast }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [parentCategory, setParentCategory] = useState<Category | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error(error);
            showToast("Не вдалося завантажити категорії.");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleOpenModal = (categoryToEdit?: Category, parent?: Category) => {
        setEditingCategory(categoryToEdit || null);
        setParentCategory(parent || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setParentCategory(null);
    };

    const handleSave = async (name: string, parentId: string | null) => {
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, { name, parentId });
                showToast("Категорію оновлено.");
            } else {
                await createCategory({ name, parentId });
                showToast("Категорію створено.");
            }
            fetchCategories();
        } catch (error) {
            showToast("Помилка збереження категорії.");
        } finally {
            handleCloseModal();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Ви впевнені, що хочете видалити цю категорію? Всі підкатегорії також будуть видалені.")) {
            try {
                await deleteCategory(id);
                showToast("Категорію видалено.");
                fetchCategories();
            } catch (error) {
                showToast("Помилка видалення. Перевірте, чи не прив'язані до неї оголошення.");
            }
        }
    };
    
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Управління категоріями</h2>
                <div>
                     <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-tg-button text-tg-button-text font-bold rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2">
                        <Icon icon="lucide:plus" /> Створити
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="bg-tg-secondary-bg-hover p-4 rounded-lg">
                    {categories.length > 0 ? (
                        <CategoryTree
                            categories={categories}
                            onAddSubcategory={parent => handleOpenModal(undefined, parent)}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <p className="text-center text-tg-hint">Категорій ще немає. Створіть першу!</p>
                    )}
                </div>
            )}
            
            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                category={editingCategory}
                parentCategory={parentCategory}
            />
        </div>
    );
};

export default CategoriesView;