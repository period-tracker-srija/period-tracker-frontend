function SymptomField({ symptomType, included, value, onToggle, onChange }) {
    return (
        <div className="border border-gray-200 rounded p-2 flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-medium text-sm">
                <input type="checkbox" checked={included} onChange={onToggle} />
                {symptomType.name}
            </label>

            {included && renderInput(symptomType, value, onChange)}
        </div>
    );
}

function renderInput(symptomType, value, onChange) {
    switch (symptomType.inputType) {
        case 'SCALE':
            return (
                <div className="flex items-center gap-2 pl-6">
                    <input
                        type="range"
                        min={symptomType.minValue}
                        max={symptomType.maxValue}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm w-6 text-center">{value}</span>
                </div>
            );

        case 'SINGLE_CHOICE':
            return (
                <select
                    className="ml-6 border border-gray-300 rounded px-2 py-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {symptomType.options.map(option => (
                        <option key={option.id} value={option.label}>{option.label}</option>
                    ))}
                </select>
            );

        case 'MULTI_CHOICE': {
            const selected = Array.isArray(value) ? value : [];
            const toggleOption = (label) => {
                if (selected.includes(label)) {
                    onChange(selected.filter(v => v !== label));
                } else {
                    onChange([...selected, label]);
                }
            };
            return (
                <div className="flex flex-wrap gap-2 pl-6">
                    {symptomType.options.map(option => (
                        <label key={option.id} className="flex items-center gap-1 text-sm">
                            <input
                                type="checkbox"
                                checked={selected.includes(option.label)}
                                onChange={() => toggleOption(option.label)}
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            );
        }

        case 'FREE_TEXT':
            return (
                <textarea
                    className="ml-6 border border-gray-300 rounded px-2 py-1"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                />
            );

        default:
            return null;
    }
}

export default SymptomField;