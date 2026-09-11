import { useEffect, useState } from 'react';
import { toLocalDateString } from './utils/dateUtils';
import SymptomField from './SymptomField';

function defaultValueForType(symptomType) {
    switch (symptomType.inputType) {
        case 'SCALE':
            return Math.round((symptomType.minValue + symptomType.maxValue) / 2);
        case 'SINGLE_CHOICE':
            return symptomType.options.length > 0 ? symptomType.options[0].label : '';
        case 'MULTIPLE_CHOICE':
            return [];
        case 'FREE_TEXT':
            return '';
        default:
            return '';
    }
}

function FullLogModal({ isOpen, onClose, cycleDayTypes, symptomTypes, initialDate, onSaved, onDeleted }) {
    const [logDate, setLogDate] = useState(toLocalDateString(new Date()));
    const [cycleDayTypeId, setCycleDayTypeId] = useState('');
    const [symptomValues, setSymptomValues] = useState({});

    const loadDate = (dateStr) => {
        setLogDate(dateStr);
        fetch(`/api/daily-logs/${dateStr}`)
            .then(res => res.json())
            .then(data => {
                if(!data || data.status) {
                    setCycleDayTypeId('');
                    setSymptomValues({});
                    return;
                }
                setCycleDayTypeId(data.cycleDayType ? data.cycleDayType.id : '');
                const values = {};
                (data.symptoms || []).forEach(s => {
                    values[s.symptomTypeId] = s.value;
                });
                setSymptomValues(values);
            })
            .catch(() => {
                setCycleDayTypeId('');
                setSymptomValues({});
            });
    };

    useEffect(() => {
        if (!isOpen) return;
        loadDate(initialDate || toLocalDateString(new Date()));
    }, [isOpen, initialDate]);

    const toggleSymptom = (symptomType) => {
        setSymptomValues(prev => {
            const updated = { ...prev };
            if (updated[symptomType.id] !== undefined) {
                delete updated[symptomType.id];
            } else {
                updated[symptomType.id] = defaultValueForType(symptomType);
            }
            return updated;
        });
    };

    const updateSymptomValue = (symptomTypeId, value) => {
        setSymptomValues(prev => ({ ...prev, [symptomTypeId]: value }));
    };

    const handleSave = () => {
        const symptoms = Object.entries(symptomValues).map(([symptomTypeId, value]) => ({
            symptomTypeId: Number(symptomTypeId),
            value,
        }));

        fetch('/api/daily-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                logDate,
                cycleDayTypeId: cycleDayTypeId || null,
                symptoms,
            }),
        })
            .then(res => res.json())
            .then(savedLog => {
                onSaved(savedLog);
                onClose();
            });
    };

    const handleDelete = () => {
        if (!window.confirm('Delete this log entirely?')) return;

        fetch(`/api/daily-logs/${logDate}`, { method: 'DELETE' })
            .then(() => {
                onDeleted(logDate);
                onClose();
            });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="bg-[#fbf8f3] rounded-lg shadow-lg p-6 w-96 max-h-[85vh] overflow-y-auto flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Full Log</h2>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Date</label>
                    <input
                        type="date"
                        className="border border-gray-300 rounded px-2 py-1"
                        value={logDate}
                        onChange={(e) => loadDate(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Cycle Day Type</label>
                    <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={cycleDayTypeId}
                        onChange={(e) => setCycleDayTypeId(e.target.value)}
                    >
                        <option value="">None</option>
                        {cycleDayTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Symptoms</label>
                    {symptomTypes.map(symptomType => (
                        <SymptomField
                            key={symptomType.id}
                            symptomType={symptomType}
                            included={symptomValues[symptomType.id] !== undefined}
                            value={symptomValues[symptomType.id]}
                            onToggle={() => toggleSymptom(symptomType)}
                            onChange={(value) => updateSymptomValue(symptomType.id, value)}
                        />
                    ))}
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <button className="px-3 py-1 rounded hover:bg-gray-100" onClick={onClose}>Cancel</button>
                    <button className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700" onClick={handleSave}>Save</button>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-end">
                    <button className="text-sm text-red-600 hover:underline" onClick={handleDelete}>
                        Delete this log
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FullLogModal;