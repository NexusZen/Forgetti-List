import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Pencil, X, ImagePlus, Loader, Check } from 'lucide-react';

const EditListModal = ({ list, onClose, onSaved }) => {
    const [listName, setListName] = useState(list.name);
    const [items, setItems] = useState(
        list.items.map(item => ({
            _id: item._id,
            name: item.name,
            imageUrl: item.imageUrl || null,
            puzzleStatus: item.puzzle ? item.puzzle.status : 'pending',
            originalName: item.name
        }))
    );
    const [newItemName, setNewItemName] = useState('');
    const [pendingImageUrl, setPendingImageUrl] = useState(null);
    const [pendingPreview, setPendingPreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const listEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const editInputRef = useRef(null);

    const MAX_ITEMS = 50;

    useEffect(() => {
        if (editingIndex !== null && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingIndex]);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }
        const preview = URL.createObjectURL(file);
        setPendingPreview(preview);
        setUploadingImage(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setPendingImageUrl(data.url);
            } else {
                setError(data.message || 'Image upload failed.');
                setPendingPreview(null);
                setPendingImageUrl(null);
            }
        } catch (err) {
            setError('Could not upload image.');
            setPendingPreview(null);
            setPendingImageUrl(null);
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearPendingImage = () => {
        setPendingImageUrl(null);
        setPendingPreview(null);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        if (items.length >= MAX_ITEMS) {
            setError(`Cannot add more than ${MAX_ITEMS} items.`);
            return;
        }
        setItems([...items, {
            _id: null,
            name: newItemName.trim(),
            imageUrl: pendingImageUrl || null,
            puzzleStatus: 'new',
            originalName: null
        }]);
        setNewItemName('');
        setPendingImageUrl(null);
        setPendingPreview(null);
        setError('');
        setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
    };

    const startEditing = (index) => {
        if (items[index].puzzleStatus !== 'pending' && items[index].puzzleStatus !== 'new') return;
        setEditingIndex(index);
        setEditValue(items[index].name);
    };

    const confirmEdit = () => {
        if (editingIndex === null) return;
        if (!editValue.trim()) return;
        const updated = [...items];
        updated[editingIndex] = { ...updated[editingIndex], name: editValue.trim() };
        setItems(updated);
        setEditingIndex(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditValue('');
    };

    const handleSave = async () => {
        if (items.length === 0) {
            setError('List must have at least one item.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: listName,
                items: items.map(item => ({
                    _id: item._id || undefined,
                    name: item.name,
                    imageUrl: item.imageUrl
                }))
            };

            const res = await fetch(`http://localhost:5000/api/grocery/${list._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                onSaved(data.data);
            } else {
                setError(data.message || 'Failed to update list.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'solved': return <span className="edit-status-badge edit-badge-solved">SOLVED</span>;
            case 'failed': return <span className="edit-status-badge edit-badge-failed">FAILED</span>;
            case 'new':    return <span className="edit-status-badge edit-badge-new">NEW</span>;
            default:       return <span className="edit-status-badge edit-badge-pending">PENDING</span>;
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9000 }}>
            <div className="modal-content edit-list-modal">
                <div className="modal-header">
                    <h3 className="modal-title">Edit List</h3>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {error && <div className="alert error-alert">{error}</div>}

                {/* List name */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>List Name</label>
                    <input
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        className="input-field"
                        placeholder="List name"
                    />
                </div>

                {/* Items */}
                <div className="edit-items-scroll">
                    {items.map((item, index) => {
                        const isEditable = item.puzzleStatus === 'pending' || item.puzzleStatus === 'new';
                        const isEditing = editingIndex === index;

                        return (
                            <div key={item._id || `new-${index}`} className={`edit-item-row ${!isEditable ? 'edit-item-locked' : ''}`}>
                                <span className="edit-item-number">{index + 1}.</span>

                                {isEditing ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        className="input-field edit-inline-input"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmEdit();
                                            if (e.key === 'Escape') cancelEdit();
                                        }}
                                    />
                                ) : (
                                    <span className="edit-item-name">{item.name}</span>
                                )}

                                {getStatusBadge(item.puzzleStatus)}

                                <div className="edit-item-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="edit-action-btn edit-confirm" onClick={confirmEdit} title="Confirm">
                                                <Check size={16} />
                                            </button>
                                            <button className="edit-action-btn edit-cancel" onClick={cancelEdit} title="Cancel">
                                                <X size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {isEditable && (
                                                <button className="edit-action-btn" onClick={() => startEditing(index)} title="Rename">
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                            <button className="edit-action-btn edit-delete" onClick={() => handleRemoveItem(index)} title="Remove">
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={listEndRef} />
                </div>

                {/* Add new item */}
                <div className="edit-add-area">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                    />

                    <div className="builder-img-slot" title="Add image">
                        {uploadingImage ? (
                            <div className="builder-img-placeholder uploading">
                                <Loader size={18} className="spin-icon" />
                            </div>
                        ) : pendingPreview ? (
                            <div className="builder-img-preview-wrap">
                                <img src={pendingPreview} alt="preview" className="builder-img-preview" />
                                <button className="builder-img-clear" onClick={clearPendingImage} type="button" title="Remove image">
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button className="builder-img-placeholder" onClick={() => fileInputRef.current?.click()} type="button" title="Add image">
                                <ImagePlus size={18} />
                            </button>
                        )}
                    </div>

                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem(e)}
                        placeholder="Add new item..."
                        className="input-field item-input"
                    />
                    <button onClick={handleAddItem} className="btn-add-item" disabled={items.length >= MAX_ITEMS}>
                        <Plus size={20} />
                    </button>
                </div>

                {/* Footer */}
                <div className="edit-modal-footer">
                    <span className={`item-count ${items.length >= MAX_ITEMS ? 'limit-reached' : ''}`}>
                        {items.length} / {MAX_ITEMS} Items
                    </span>
                    <button
                        onClick={handleSave}
                        className="btn-primary btn-save-list"
                        disabled={saving || items.length === 0}
                    >
                        <Save size={18} style={{ marginRight: '8px' }} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditListModal;
