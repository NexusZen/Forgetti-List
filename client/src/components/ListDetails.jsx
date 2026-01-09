import { ArrowLeft, Calendar, Layout, Trash2 } from 'lucide-react';

const ListDetails = ({ list, onBack }) => {
    return (
        <div className="list-details-view">
            <button onClick={onBack} className="btn-back">
                <ArrowLeft size={20} />
                Back to Lists
            </button>

            <div className="details-header-card">
                <div className="header-content">
                    <h2 className="details-title">{list.name}</h2>
                    <div className="details-meta">
                        <div className="meta-item">
                            <Calendar size={18} />
                            <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-divider">•</div>
                        <div className="meta-item">
                            <Layout size={18} />
                            <span>{list.items.length} Items</span>
                        </div>
                    </div>
                </div>
                {/* Placeholder for future delete content */}
                {/* <button className="btn-icon-danger"><Trash2 size={20} /></button> */}
            </div>

            <div className="items-card">
                {list.items.length > 0 ? (
                    list.items.map((item, index) => (
                        <div key={index} className="detail-item">
                            <div className="custom-checkbox">
                                <div className="checkmark"></div>
                            </div>
                            <span className="item-text">{item}</span>
                        </div>
                    ))
                ) : (
                    <div className="empty-state-small">
                        <p>No items in this list.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListDetails;
