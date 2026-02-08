import { useState } from 'react';

const GroceryListBuilder = ({ onListCreated }) => {
    const [listName, setListName] = useState('My Grocery List');
    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const MAX_ITEMS = 50;

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
                if (onListCreated) onListCreated(); // Callback to refresh parent list if needed
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
        <div className="card grocery-builder">
            <h3>Create New List</h3>

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="form-group">
                <label>List Name</label>
                <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="e.g., Weekly Groceries"
                />
            </div>

            <div className="item-input-group">
                <input
                    type="text"
                    value={currentItem}
                    onChange={(e) => setCurrentItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem(e)}
                    placeholder="Add an item (e.g., Milk)"
                    className="item-input"
                />
                <button
                    onClick={handleAddItem}
                    className="btn-add"
                    disabled={items.length >= MAX_ITEMS}
                >
                    Add
                </button>
            </div>

            <div className="list-status">
                <span className={items.length >= MAX_ITEMS ? 'limit-reached' : ''}>
                    Items: {items.length} / {MAX_ITEMS}
                </span>
            </div>

            <ul className="items-preview">
                {items.map((item, index) => (
                    <li key={index} className="item-tag">
                        {item}
                        <button onClick={() => handleRemoveItem(index)} className="btn-remove">×</button>
                    </li>
                ))}
            </ul>

            {items.length > 0 && (
                <button
                    onClick={handleSubmitList}
                    className="btn-primary btn-save"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save List'}
                </button>
            )}
        </div>
    );
};

export default GroceryListBuilder;
