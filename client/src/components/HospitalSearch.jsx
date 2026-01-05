import { useState, useEffect } from 'react';
import axios from 'axios';

function HospitalSearch({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const searchHospitals = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const response = await axios.get(`/api/hospitals?query=${query}`);
                setResults(response.data);
            } catch (error) {
                console.error("Error searching hospitals", error);
            }
        };

        const timeoutId = setTimeout(searchHospitals, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                placeholder="Search Hospital Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            />
            {isSearching && results.length > 0 && (
                <ul className="search-results">
                    {results.map((hospital) => (
                        <li
                            key={hospital.id}
                            className="search-result-item"
                            onClick={() => {
                                onSelect(hospital);
                                setQuery(hospital.name);
                                setIsSearching(false);
                                setResults([]);
                            }}
                        >
                            <strong>{hospital.name}</strong> <br />
                            <small>{hospital.city}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default HospitalSearch;
