function formatSymptomPreview(symptoms, symptomTypes) {
    if(!symptoms || symptoms.length === 0) return 'No symptoms';

    return symptoms
        .map(s => {
            const type = symptomTypes.find(t => t.id === s.symptomTypeId);
            const name = type ? type.name : 'Symptom';

            const value = Array.isArray(s.value) ? s.value.join(', ') : s.value;
            return `${name}: ${value}`;
        })
        .join(' . ');
}

function HistoryList({ logs, symptomTypes, onEdit, onDelete }) {
    const sortedLogs = [...logs].sort((a, b) =>
        b.logDate.localeCompare(a.logDate)
    );

    if(sortedLogs.length === 0) {
        return (
            <p className="text-gray-500 text-center mt-10">
                No logs yet. Tap Log to add one.
            </p>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-3">
            {sortedLogs.map(log => (
                <div
                    key={log.logDate}
                    className="flex items-center justify-between gap-4 border border-gray-200 rounded-lg px-4 py-3"
                >
                    <div className="min-w-0">
                        <div className="font-medium text-gray-800">
                            {log.logDate}
                        </div>

                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                            {log.cycleDayType ? (
                                <>
                                    <span
                                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: log.cycleDayType.color }}
                                    ></span>
                                    {log.cycleDayType.name}
                                </>
                            ) : (
                                <span>No cycle day type</span>
                            )}
                        </div>

                        <div className="text-sm text-gray-500 mt-` truncate">
                            {formatSymptomPreview(log.symptoms, symptomTypes)}
                        </div>
                    </div>

                <div className="flex gap-2 shrink-0">
                        <button
                            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                            onClick={() => onEdit(log.logDate)}
                        >
                            Edit
                        </button>
                        <button
                            className="px-3 py-1 rounded text-red-600 border border-red-200 hover:bg-red-50"
                            onClick={() => onDelete(log.logDate)}
                        >
                            Delete
                        </button>
                </div>

                </div>
            ))}
        </div>
    );
}

export default HistoryList;