import { useEffect, useState } from 'react';

export default function TestPage() {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('No debug info yet');

  useEffect(() => {
    // Use fetch directly to avoid any issues with the queryClient
    const fetchAdvisors = async () => {
      try {
        setDebugInfo('Attempting to fetch advisors');
        const response = await fetch('/api/advisors');
        setDebugInfo(`Fetch response status: ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setDebugInfo(`Received data: ${JSON.stringify(data).substring(0, 100)}...`);
        setAdvisors(data);
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error';
        console.error('Error fetching advisors:', errorMessage);
        setDebugInfo(`Error occurred: ${errorMessage}`);
        setError(`Failed to load advisors: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, []);

  // Define some static data to ensure rendering works
  const staticAdvisors = [
    { id: 999, name: "Static Test Advisor", bio: "This is a static test", online: true },
    { id: 998, name: "Another Static Advisor", bio: "Another static test", online: false }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <pre className="whitespace-pre-wrap text-sm">{debugInfo}</pre>
      </div>
      
      {loading && <p className="text-xl font-bold">Loading...</p>}
      {error && <p className="text-xl font-bold text-red-500">{error}</p>}
      
      <h2 className="text-2xl font-semibold mb-4">Static Test Advisors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {staticAdvisors.map(advisor => (
          <div key={advisor.id} className="border rounded-lg p-4 shadow-sm bg-white">
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
      
      {!loading && !error && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Dynamic Advisors from API</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advisors.map(advisor => (
              <div key={advisor.id} className="border rounded-lg p-4 shadow-sm bg-white">
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