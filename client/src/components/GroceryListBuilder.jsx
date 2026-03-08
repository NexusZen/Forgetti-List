import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, ImagePlus, X, Loader } from 'lucide-react';

const GroceryListBuilder = ({ onListCreated }) => {
    const [listName, setListName] = useState('My Grocery List');
    const [items, setItems] = useState([]); // each: { name, imageUrl, imagePreview }
    const [currentItem, setCurrentItem] = useState('');
    const [pendingImageUrl, setPendingImageUrl] = useState(null);   // Cloudinary URL
    const [pendingPreview, setPendingPreview] = useState(null);     // Local blob preview
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const listEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const MAX_ITEMS = 50;

    useEffect(() => {
        if (listEndRef.current) {
            listEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [items]);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be under 5MB.');
            return;
        }

        // Show local preview immediately
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
            setError('Could not upload image. Server might be down.');
            setPendingPreview(null);
            setPendingImageUrl(null);
        } finally {
            setUploadingImage(false);
            // Reset file input so same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearPendingImage = () => {
        setPendingImageUrl(null);
        setPendingPreview(null);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!currentItem.trim()) return;

        if (items.length >= MAX_ITEMS) {
            setError(`You cannot add more than ${MAX_ITEMS} items.`);
            return;
        }

        setItems([...items, {
            name: currentItem.trim(),
            imageUrl: pendingImageUrl || null,
            imagePreview: pendingPreview || null
        }]);
        setCurrentItem('');
        setPendingImageUrl(null);
        setPendingPreview(null);
        setError('');
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        if (newItems.length < MAX_ITEMS) setError('');
    };

    const handleSubmitList = async () => {
        if (items.length === 0) {
            setError('Please add at least one item to the list.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            // Send items as objects so imageUrl is preserved
            const itemsPayload = items.map(({ name, imageUrl }) => ({ name, imageUrl }));

            const response = await fetch('http://localhost:5000/api/grocery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: listName, items: itemsPayload })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('List saved successfully!');
                setItems([]);
                setListName('My Grocery List');
                setTimeout(() => {
                    if (onListCreated) onListCreated();
                }, 1000);
            } else {
                setError(data.message || 'Failed to save list');
            }
        } catch (err) {
            setError('Server error, please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grocery-builder-container">
            <h3 className="builder-title">Create New List</h3>

            {error && <div className="alert error-alert">{error}</div>}
            {success && <div className="alert success-alert">{success}</div>}

            <div className="builder-header">
                <div className="form-group">
                    <label>List Name</label>
                    <input
                        type="text"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        placeholder="e.g., Weekly Groceries"
                        className="input-field"
                    />
                </div>
            </div>

            {/* Item input row */}
            <div className="builder-add-area">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageSelect}
                />

                {/* Image preview / upload button */}
                <div className="builder-img-slot" title="Add image for this item">
                    {uploadingImage ? (
                        <div className="builder-img-placeholder uploading">
                            <Loader size={18} className="spin-icon" />
                        </div>
                    ) : pendingPreview ? (
                        <div className="builder-img-preview-wrap">
                            <img src={pendingPreview} alt="preview" className="builder-img-preview" />
                            <button
                                className="builder-img-clear"
                                onClick={clearPendingImage}
                                type="button"
                                title="Remove image"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <button
                            className="builder-img-placeholder"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                            title="Add image"
                        >
                            <ImagePlus size={18} />
                        </button>
                    )}
                </div>

                <input
                    type="text"
                    value={currentItem}
                    onChange={(e) => setCurrentItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem(e)}
                    placeholder="Add an item (e.g., Milk)"
                    className="input-field item-input"
                />
                <button
                    onClick={handleAddItem}
                    className="btn-add-item"
                    disabled={items.length >= MAX_ITEMS}
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Items list */}
            <div className="items-list-container">
                {items.length === 0 ? (
                    <div className="empty-list-placeholder">
                        <p>No items added yet. Start adding!</p>
                    </div>
                ) : (
                    <ul className="items-list-scroll">
                        {items.map((item, index) => (
                            <li key={index} className="builder-item-row">
                                {/* Thumbnail circle */}
                                <div className="builder-item-thumb">
                                    {item.imagePreview ? (
                                        <img src={item.imagePreview} alt={item.name} className="builder-thumb-img" />
                                    ) : (
                                        <div className="builder-thumb-placeholder">
                                            <ImagePlus size={14} color="#9CA3AF" />
                                        </div>
                                    )}
                                </div>
                                <span className="item-number">{index + 1}.</span>
                                <span className="item-content">{item.name}</span>
                                <button onClick={() => handleRemoveItem(index)} className="btn-remove-item">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                        <div ref={listEndRef} />
                    </ul>
                )}
            </div>

            <div className="builder-footer">
                <span className={`item-count ${items.length >= MAX_ITEMS ? 'limit-reached' : ''}`}>
                    {items.length} / {MAX_ITEMS} Items
                </span>

                <button
                    onClick={handleSubmitList}
                    className="btn-primary btn-save-list"
                    disabled={loading || items.length === 0}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    {loading ? 'Saving...' : 'Save List'}
                </button>
            </div>
        </div>
    );
};

export default GroceryListBuilder;
