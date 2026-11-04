import "./LiveMonitoring.css";

function LiveMonitoring() {

    const candidates = [

        {
            id: 1,
            name: "John Doe",
            timer: "00:42:15",
            warning: 1,
            status: "Online"
        },

        {
            id: 2,
            name: "Alice Smith",
            timer: "00:38:52",
            warning: 0,
            status: "Online"
        },

        {
            id: 3,
            name: "Robert",
            timer: "00:29:31",
            warning: 3,
            status: "Warning"
        },

        {
            id: 4,
            name: "David",
            timer: "00:51:04",
            warning: 2,
            status: "Online"
        }

    ];

    return (

        <div className="live-page">

            <h1>Live Exam Monitoring</h1>

            <div className="summary">

                <div className="summary-card">

                    <h3>Online Candidates</h3>

                    <h2>24</h2>

                </div>

                <div className="summary-card">

                    <h3>Running Exams</h3>

                    <h2>18</h2>

                </div>

                <div className="summary-card">

                    <h3>Total Warnings</h3>

                    <h2>12</h2>

                </div>

            </div>

            <div className="candidate-grid">

                {

                    candidates.map(candidate => (

                        <div
                            className="candidate-card"
                            key={candidate.id}
                        >

                            <div className="camera-placeholder">

                                📷

                            </div>

                            <h3>{candidate.name}</h3>

                            <p>

                                Timer :
                                {candidate.timer}

                            </p>

                            <p>

                                Warnings :
                                {candidate.warning}

                            </p>

                            <p>

                                Status :
                                <span
                                    className={
                                        candidate.status === "Online"

                                            ?

                                            "online"

                                            :

                                            "warning"

                                    }
                                >

                                    {candidate.status}

                                </span>

                            </p>

                            <button>

                                View Details

                            </button>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default LiveMonitoring;