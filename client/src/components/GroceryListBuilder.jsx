import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

const GroceryListBuilder = ({ onListCreated }) => {
    const [listName, setListName] = useState('My Grocery List');
    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const listEndRef = useRef(null);

    const MAX_ITEMS = 50;

    // Scroll to bottom when items added
    useEffect(() => {
        if (listEndRef.current) {
            listEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [items]);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!currentItem.trim()) return;

        if (items.length >= MAX_ITEMS) {
            setError(`You cannot add more than ${MAX_ITEMS} items.`);
            return;
        }

        setItems([...items, currentItem.trim()]);
        setCurrentItem('');
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
            const response = await fetch('http://localhost:5000/api/grocery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: listName, items })
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

            <div className="builder-add-area">
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

            <div className="items-list-container">
                {items.length === 0 ? (
                    <div className="empty-list-placeholder">
                        <p>No items added yet. Start adding!</p>
                    </div>
                ) : (
                    <ul className="items-list-scroll">
                        {items.map((item, index) => (
                            <li key={index} className="builder-item-row">
                                <span className="item-number">{index + 1}.</span>
                                <span className="item-content">{item}</span>
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
