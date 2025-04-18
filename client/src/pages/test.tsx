import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

export default function TestPage() {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const response = await apiRequest('GET', '/api/advisors');
        const data = await response.json();
        setAdvisors(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching advisors:', err);
        setError('Failed to load advisors');
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Advisors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisors.map(advisor => (
              <div key={advisor.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="text-xl font-medium">{advisor.name}</h3>
                <p className="text-gray-600">{advisor.bio}</p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${advisor.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {advisor.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}