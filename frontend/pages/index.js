import { useState, useEffect } from "react";

export default function Home() {
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedRep, setSelectedRep] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/sales-reps")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        return res.json();
      })
      .then((data) => {
        setSalesReps(data.salesReps || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    try {
      setAnswer("Loading...");
      const response = await fetch("http://localhost:8000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error in AI request:", error);
      setAnswer("Sorry, there was an error processing your request.");
    }
  };

  const handleViewDetails = (rep) => {
    setSelectedRep(selectedRep && selectedRep.id === rep.id ? null : rep);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#2c3e50", borderBottom: "2px solid #3498db", paddingBottom: "10px" }}>
        Sales Dashboard
      </h1>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "4px", marginBottom: "1rem" }}>
          Error: {error}
        </div>
      )}

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: "#2c3e50" }}>Sales Representatives</h2>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading sales data...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {salesReps.map((rep) => (
              <div key={rep.id} style={{ 
                border: "1px solid #ddd", 
                borderRadius: "8px", 
                padding: "15px",
                backgroundColor: "#f9f9f9",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ color: "#3498db", marginTop: 0 }}>{rep.name}</h3>
                <p><strong>Role:</strong> {rep.role}</p>
                <p><strong>Region:</strong> {rep.region}</p>
                
                <div style={{ marginBottom: "10px" }}>
                  <strong>Skills:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                    {rep.skills.map((skill, index) => (
                      <span key={index} style={{ 
                        backgroundColor: "#3498db", 
                        color: "white", 
                        padding: "3px 8px", 
                        borderRadius: "4px",
                        fontSize: "0.8rem"
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleViewDetails(rep)}
                  style={{
                    backgroundColor: "#2c3e50",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  {selectedRep && selectedRep.id === rep.id ? "Hide Details" : "View Details"}
                </button>
                
                {selectedRep && selectedRep.id === rep.id && (
                  <div style={{ marginTop: "15px" }}>
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "5px" }}>Deals</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "5px", borderBottom: "1px solid #ddd" }}>Client</th>
                          <th style={{ textAlign: "right", padding: "5px", borderBottom: "1px solid #ddd" }}>Value</th>
                          <th style={{ textAlign: "center", padding: "5px", borderBottom: "1px solid #ddd" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rep.deals.map((deal, index) => (
                          <tr key={index}>
                            <td style={{ padding: "5px", borderBottom: "1px solid #eee" }}>{deal.client}</td>
                            <td style={{ textAlign: "right", padding: "5px", borderBottom: "1px solid #eee" }}>
                              ${deal.value.toLocaleString()}
                            </td>
                            <td style={{ 
                              textAlign: "center", 
                              padding: "5px", 
                              borderBottom: "1px solid #eee",
                              color: deal.status === "Closed Won" ? "green" : 
                                    deal.status === "Closed Lost" ? "red" : "orange"
                            }}>
                              {deal.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <h4 style={{ borderBottom: "1px solid #ddd", paddingBottom: "5px", marginTop: "15px" }}>Clients</h4>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "5px", borderBottom: "1px solid #ddd" }}>Name</th>
                          <th style={{ textAlign: "left", padding: "5px", borderBottom: "1px solid #ddd" }}>Industry</th>
                          <th style={{ textAlign: "left", padding: "5px", borderBottom: "1px solid #ddd" }}>Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rep.clients.map((client, index) => (
                          <tr key={index}>
                            <td style={{ padding: "5px", borderBottom: "1px solid #eee" }}>{client.name}</td>
                            <td style={{ padding: "5px", borderBottom: "1px solid #eee" }}>{client.industry}</td>
                            <td style={{ padding: "5px", borderBottom: "1px solid #eee" }}>
                              <a href={`mailto:${client.contact}`} style={{ color: "#3498db" }}>
                                {client.contact}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ 
        marginTop: "2rem", 
        padding: "20px", 
        backgroundColor: "#f0f7ff", 
        borderRadius: "8px",
        border: "1px solid #d0e3ff"
      }}>
        <h2 style={{ color: "#2c3e50", marginTop: 0 }}>Ask a Question (AI Assistant)</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="Ask about sales data, performance, or strategies..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ 
              flex: 1, 
              padding: "10px", 
              borderRadius: "4px", 
              border: "1px solid #ddd",
              fontSize: "16px"
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <button 
            onClick={handleAskQuestion}
            style={{
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Ask
          </button>
        </div>
        {answer && (
          <div style={{ 
            marginTop: "1rem", 
            padding: "15px", 
            backgroundColor: "white", 
            borderRadius: "4px",
            border: "1px solid #ddd"
          }}>
            <strong>AI Response:</strong> 
            <p style={{ marginTop: "10px", lineHeight: "1.5" }}>{answer}</p>
          </div>
        )}
      </section>
    </div>
  );
}
