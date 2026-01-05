import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ReportList() {
    const [reports, setReports] = useState([]);
    const [searchDate, setSearchDate] = useState('');
    const [searchCustomer, setSearchCustomer] = useState('');
    const [searchProducts, setSearchProducts] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const params = new URLSearchParams();
            if (searchDate) params.append('date', searchDate);
            if (searchCustomer) params.append('customer', searchCustomer);
            if (searchProducts) params.append('products', searchProducts);

            const response = await axios.get('/api/reports', { params });
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports', error);
        }
    };

    const handleSearch = () => {
        fetchReports();
    };

    const handleClear = () => {
        setSearchDate('');
        setSearchCustomer('');
        setSearchProducts('');
        // We need to wait for state update or pass empty values directly
        // Better to just call fetch directly with empty params if we want immediate update
        // Or cleaner: Reset state then trigger effect? 
        // Let's manually trigger fetch with empty params ensuring UI update
        // But setState is async. Let's just refetch after clearing.
        // Actually, simplest is:
        // setSearchDate('', () => fetchReports()); // No callback in hooks
        // We will just clear inputs. User can click search again or we can auto-search?
        // Let's implement auto-search on clear for better UX, but passing empty params directly.

        // Correct approach for 'Clear':
        setSearchDate('');
        setSearchCustomer('');
        setSearchProducts('');

        // To fetch all immediately without waiting for re-render cycle issues in this specific function scope:
        axios.get('/api/reports').then(res => setReports(res.data)).catch(err => console.error(err));
    };

    const handleRowClick = (id) => {
        navigate(`/reports/${id}`);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent row click from triggering
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await axios.delete(`/api/reports/${id}`);
                setReports(reports.filter(report => report.id !== id));
            } catch (error) {
                console.error('Error deleting report', error);
                alert('Failed to delete report.');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <h2>Service History</h2>

            <div className="search-bar" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="form-control"
                    title="Search by Date"
                />
                <input
                    type="text"
                    placeholder="Customer (Hospital)"
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="form-control"
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <input
                    type="text"
                    placeholder="Products"
                    value={searchProducts}
                    onChange={(e) => setSearchProducts(e.target.value)}
                    className="form-control"
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <button onClick={handleSearch} className="btn-primary" style={{ padding: '8px 16px' }}>Search</button>
                <button onClick={handleClear} className="btn-secondary" style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white' }}>Clear</button>
            </div>


            {reports.length === 0 ? (
                <p>No reports found.</p>
            ) : (
                <table className="report-list-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Products</th>
                            <th>Subject</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id} onClick={() => handleRowClick(report.id)}>
                                <td>{report.hospitalName}</td>
                                <td>{report.serviceDate}</td>
                                <td>{report.products}</td>
                                <td>{report.subject}</td>
                                <td>{new Date(report.created_at).toLocaleString()}</td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={(e) => handleDelete(e, report.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ReportList;
