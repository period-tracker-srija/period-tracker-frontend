import { useEffect, useState } from "react";
import './index.css';
import { toLocalDateString } from "./utils/dateUtils";
import Calendar from "./Calendar";
import FullLogModal from "./FullLogModal";

function App() {
    const [logsByDate, setLogsByDate] = useState({});
    const [cycleDayTypes, setCycleDayTypes] = useState([]);
    const [dropdown, setDropdown] = useState(null);
    const [showNewTypeForm, setShowNewTypeForm] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeColor, setNewTypeColor] = useState('#cccccc');
    const [showFullLog, setShowFullLog] = useState(false);

    useEffect(() => {
        fetch('/api/cycle-day-types')
            .then(res => res.json())
            .then(setCycleDayTypes);
    }, []);

    useEffect(() => {
        fetch('/api/symptom-types')
            .then(res => res.json())
            .then(setSymptomTypes);
    }, []);

    useEffect(() => {
        fetch('/api/daily-logs')
            .then(res => res.json())
            .then(data => {
                const map = {};
                data.forEach(log => {
                    map[log.logDate] = log.cycleDayType;
                });
                setLogsByDate(map);
            });
    }, []);

    const closeDropdown = () => {
        setDropdown(null);
        setShowNewTypeForm(false);
        setNewTypeName('');
    };

    const handleDateClick = (date, event) => {
        setDropdown({ date, x: event.clientX, y: event.clientY });
    };

    const handleTypeSelect = (cycleDayTypeId) => {
        const dateString = toLocalDateString(dropdown.date);

        fetch(`/api/daily-logs/${dateString}`)
            .then(res => res.json())
            .then(existing => {
                const existingSymptoms = existing.symptoms.map(s => ({
                    symptomTypeId: s.symptomTypeId,
                    value: s.value,
                }));

                return fetch('/api/daily-logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        logDate: dateString,
                        cycleDayTypeId,
                        symptoms: existingSymptoms,
                    }),
                });
            })
            .then(res => res.json())
            .then(savedLog => {
                setLogsByDate(prev => ({ ...prev, [savedLog.logDate]: savedLog.cycleDayType }));
                closeDropdown();
            });
    };

    const handleCreateType = () => {
        fetch('/api/cycle-day-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newTypeName, color: newTypeColor }),
        })
            .then(res => res.json())
            .then(newType => {
                setCycleDayTypes(prev => [...prev, newType]);
                handleTypeSelect(newType.id);
            });
    };

    const handleDeleteLog = () => {
        const dateString = toLocalDateString(dropdown.date);
        fetch(`/api/daily-logs/${dateString}`, { method: 'DELETE' })
            .then(() => {
                setLogsByDate(prev => {
                    const updated = { ...prev };
                    delete updated[dateString];
                    return updated;
                });
                closeDropdown();
            });
    };

    const handleFullLogSaved = (savedLog) => {
        setLogsByDate(prev => ({
            ...prev,
            [savedLog.logDate]: savedLog.cycleDayType,
        }));
    };

    const handleFullLogDeleted = (deletedDate) => {
        setLogsByDate(prev => {
            const updated = { ...prev };
            delete updated[deletedDate];
            return updated;
        });
    };

    const dropdownDateString = dropdown ? toLocalDateString(dropdown.date) : null;
    const dropdownIsLogged = dropdownDateString ? Boolean(logsByDate[dropdownDateString]) : false;
    const [fullLogDate, setFullLogDate] = useState(null);

    const handleOpenFullLogFromCalendar = () => {
    setFullLogDate(toLocalDateString(dropdown.date));
    setShowFullLog(true);
    closeDropdown();
};

    const [symptomTypes, setSymptomTypes] = useState([]);

    return (
        <div className="min-h-screen flex flex-col px-6 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-800">
                    Period Tracker
                </h1>

                <button
                    className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
                    onClick={() => {
                        setFullLogDate(toLocalDateString(new Date()));
                        setShowFullLog(true);
                    }}
                >
                    Log
                </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center ">
                <Calendar logsByDate={logsByDate} onDateClick={handleDateClick} />
            </div>

            {dropdown && (
                <>
                    <div className="fixed inset-0" onClick={closeDropdown}></div>
                    <div
                        className="fixed z-10 bg-white border border-gray-300 rounded-md shadow-lg flex flex-col"
                        style={{ top: dropdown.y, left: dropdown.x }}
                    >
                        {!showNewTypeForm ? (
                            <>
                                <button
                                    className="px-4 py-2 text-left hover:bg-gray-100"
                                    onClick={handleOpenFullLogFromCalendar}
                                >
                                    Open Full Log
                                </button>
                                <div className="border-t border-gray-200"></div>

                                {cycleDayTypes.map(type => (
                                    <button
                                        key={type.id}
                                        className="px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                                        onClick={() => handleTypeSelect(type.id)}
                                    >
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                                            style={{ backgroundColor: type.color }}
                                        ></span>
                                        {type.name}
                                    </button>
                                ))}
                                <button
                                    className="px-4 py-2 text-left hover:bg-gray-100 border-t border-gray-200"
                                    onClick={() => setShowNewTypeForm(true)}
                                >
                                    + Add custom type
                                </button>
                                {dropdownIsLogged && (
                                    <button
                                        className="px-4 py-2 text-left hover:bg-gray-100 border-t border-gray-200 text-red-600"
                                        onClick={handleDeleteLog}
                                    >
                                        Delete Log
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col gap-1.5 p-2">
                                <input
                                    type="text"
                                    className="px-1.5 py-1 border border-gray-300 rounded"
                                    placeholder="Type name"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                />
                                <input
                                    type="color"
                                    value={newTypeColor}
                                    onChange={(e) => setNewTypeColor(e.target.value)}
                                />
                                <button
                                    className="px-2 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                                    onClick={handleCreateType}
                                >
                                    Create & Log
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <FullLogModal
                isOpen={showFullLog}
                onClose={() => setShowFullLog(false)}
                cycleDayTypes={cycleDayTypes}
                onSaved={handleFullLogSaved}
                onDeleted={handleFullLogDeleted}
                symptomTypes={symptomTypes}
                initialDate={fullLogDate}
            />
        </div>
    );
}

export default App;