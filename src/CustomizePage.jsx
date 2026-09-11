import { useEffect, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DragHandle({ listeners, attributes }) {
    return (
        <button
            type="button"
            className="px-1 py-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
        >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="3" r="1.3" />
                <circle cx="9" cy="3" r="1.3" />
                <circle cx="3" cy="8" r="1.3" />
                <circle cx="9" cy="8" r="1.3" />
                <circle cx="3" cy="13" r="1.3" />
                <circle cx="9" cy="13" r="1.3" />
            </svg>
        </button>
    );
}

function ToggleSwitch({ checked, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label || (checked ? 'On' : 'Off')}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${
                checked ? 'bg-green-500' : 'bg-gray-300'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-out ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

function SortableTypeRow({ type, canDelete, onNameBlur, onColorChange, onDelete, onActiveToggle }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: type.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : (type.active ? 1 : 0.5),
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 border border-[#e4dcd0] rounded-lg px-3 py-2 bg-[#fbf8f3]"
        >
            <DragHandle listeners={listeners} attributes={attributes} />

            <input 
                type="color"
                value={type.color || '#cccccc'}
                onChange={(e) => onColorChange(type, e.target.value)}
                className="w-8 h-8 cursor-pointer border-0 bg-transparent"
                title="Color"
            />

            <input 
                type="text"
                defaultValue={type.name}
                key={`${type.id}-${type.name}`}
                className="flex-1 border border-gray-300 rounded px-2 py-1"
                onBlur={(e) => onNameBlur(type, e.target.value)}
            />

            <ToggleSwitch 
                checked={!!type.active}
                onChange={(next) => onActiveToggle(type, next)}
                label={`Enable ${type.name}`}
            />

            <button
                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                disabled={!canDelete}
                onClick={() => onDelete(type)}
            >
                Delete
            </button>
        </div>
    )
}

function inputTypeLabel(inputType) {
    switch(inputType) {
        case 'SCALE': return 'Scale';
        case 'SINGLE_CHOICE': return 'Single choice'
        case 'MULTI_CHOICE': return 'Multi choice'
        case 'FREE_TEXT': return 'Text'
        default: return inputType;
    }
}

function SortableSymptomRow({ symptom, onNameBlur, onDelete, onActiveToggle }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: symptom.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : (symptom.active ? 1 : 0.5),
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#fbf8f3]"
        >
            <DragHandle listeners={listeners} attributes={attributes} />

            <div className="flex-1 min-w-0">
                <input 
                    type="text"
                    defaultValue={symptom.name}
                    key={`${symptom.id}-${symptom.name}`}
                    className="w-full border border-gray-300 rounded px-2 py-1"
                    onBlur={(e) => onNameBlur(symptom, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-0.5">
                    {inputTypeLabel(symptom.inputType)}
                    {symptom.inputType === 'SCALE' && symptom.minValue != null && symptom.maxValue != null
                        ? ` . ${symptom.minValue}-${symptom.maxValue}`
                        : ''}
                </p>
            </div>

            <ToggleSwitch 
                checked={!!symptom.active}
                onChange={(next) => onActiveToggle(symptom, next)}
                label={`Enable ${symptom.name}`}
            />

            <button
                className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                onClick={() => onDelete(symptom)}
            >
                Remove
            </button>
        </div>
    );
}

function CustomizePage({ cycleDayTypes, onCycleDayTypesChange, onTypeUpdated, onTypeDeleted, symptomTypes, onSymptomTypesChange}) {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#cccccc');
    const [error, setError] = useState('');

    const [symptomError, setSymptomError] = useState('');
    const [newSymptomName, setNewSymptomName] = useState('');
    const [newInputType, setNewInputType] = useState('SCALE');
    const [newMinValue, setNewMinValue] = useState(1);
    const [newMaxValue, setNewMaxValue] = useState(5);
    const [newOptionsText, setNewOptionsText] = useState('');

    const [allCycleDayTypes, setAllCycleDayTypes] = useState(cycleDayTypes);
    const [allSymptomTypes, setAllSymptomTypes] = useState(symptomTypes);

    useEffect(() => {
        fetch('/api/cycle-day-types/all')
            .then(res => res.json())
            .then(data => {
                if(!Array.isArray(data)) return;
                setAllCycleDayTypes(data);
                onCycleDayTypesChange(data.filter(t => t.active));
            })
            .catch(() => {});
        fetch('/api/symptom-types/all')
            .then(res => res.json())
            .then(data => {
                if(!Array.isArray(data)) return;
                setAllSymptomTypes(data);
                onSymptomTypesChange(data.filter(s => s.active));
            })
            .catch(() => {});
    }, []);

    const handleCycleActiveToggle = (type, active) => {
        setError('');
        fetch(`/api/cycle-day-types/${type.id}/active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active }),
        })
            .then(res => {
                if(!res.ok) throw new Error('Could not update type');
                return res.json();
            })
            .then(updated => {
                const next = allCycleDayTypes.map(t => (t.id === updated.id ? updated : t));
                setAllCycleDayTypes(next);
                onCycleDayTypesChange(next.filter(t => t.active));
                onTypeUpdated(updated);
            })
            .catch(err => setError(err.message));
    }

    const handleSymptomActiveToggle = (symptom, active) => {
        setSymptomError('');
        fetch(`/api/symptom-types/${symptom.id}/active`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ active }),
        })
            .then(res => {
                if(!res.ok) throw new Error('Could not update symptom');
                return res.json();
            })
            .then(updated => {
                const next = allSymptomTypes.map(s => (s.id === updated.id ? updated : s));
                setAllSymptomTypes(next);
                onSymptomTypesChange(next.filter(s => s.active));
            })
            .catch(err => setSymptomError(err.message));
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    const refreshFromServer = () => {
        return fetch('/api/cycle-day-types')
            .then(res => res.json())
            .then(onCycleDayTypesChange);
    };

    const refreshSymptomsFromServer = () => {
        return fetch('/api/symptom-types')
            .then(res => res.json())
            .then(onSymptomTypesChange);
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        setError('');

        fetch('/api/cycle-day-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), color: newColor }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Could not create type');
                return res.json();
            })
            .then(created => {
                onCycleDayTypesChange([...cycleDayTypes, created]);
                setNewName('');
                setNewColor('#cccccc');
            })
            .catch(err => setError(err.message));
    };

    const handleAddSymptom = () => {
        if(!newSymptomName.trim()) return;
        setSymptomError('');

        const body = {
            name: newSymptomName.trim(),
            inputType: newInputType,
        };

        if(newInputType === 'SCALE') {
            body.minValue = Number(newMinValue);
            body.maxValue = Number(newMaxValue);
        }

        if(newInputType === 'SINGLE_CHOICE' || newInputType === 'MULTI_CHOICE') {
            const options = newOptionsText
                .split(',')
                .map(o => o.trim())
                .filter(Boolean);
            if(options.length === 0) {
                setSymptomError('Add at least one option (comma-separated)');
                return;
            }
            body.options = options;
        }

        fetch('/api/symptom-types', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        })
            .then(res => {
                if(!res.ok) throw new Error('Could not create symptom');
                return res.json();
            })
            .then(created => {
                onSymptomTypesChange([...symptomTypes, created]);
                setNewSymptomName('');
                setNewInputType('SCALE');
                setNewMinValue(1);
                setNewMaxValue(5);
                setNewOptionsText('');
            })
            .catch(err => setSymptomError(err.message));
    };

    const handleNameBlur = (type, name) => {
        const trimmed = name.trim();
        if(!trimmed || trimmed === type.name) return;
        setError('');

        fetch(`/api/cycle-day-types/${type.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmed, color: type.color }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Could not update name');
                return res.json();
            })
            .then(updated => {
                onCycleDayTypesChange(
                    cycleDayTypes.map(t => (t.id === updated.id ? updated : t))
                );
                onTypeUpdated(updated);
            })
            .catch(err => setError(err.message));
    };

    const handleSymptomNameBlur = (symptom, name) => {
        const trimmed = name.trim();
        if(!trimmed || trimmed === symptom.name) return;
        setSymptomError('');

        fetch(`/api/symptom-types/${symptom.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmed }),
        })
            .then(res => {
                if(!res.ok) throw new Error('Could not update symptom name');
                return res.json();
            })
            .then(updated => {
                onSymptomTypesChange(
                    symptomTypes.map(s => (s.id === updated.is ? updated : s))
                );
            })
            .catch(err => setSymptomError(err.message));
    };

    const handleColorChange = (type, color) => {
        setError('');

        fetch(`/api/cycle-day-types/${type.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: type.name, color}),
        })
            .then(res => {
                if (!res.ok) throw new Error('Could not update color');
                return res.json();
            })
            .then(updated => {
                onCycleDayTypesChange(
                    cycleDayTypes.map(t => (t.id === updated.id ? updated : t))
                );
                onTypeUpdated(updated);
            })
            .catch(err => setError(err.message));
    };

    const handleDelete = (type) => {
        if (cycleDayTypes.length <= 1) {
            setError('At least once cycle day type must exist');
            return;
        }
        if (!window.confirm(`Delete "${type.name}"? Days using it will lose this type.`)) {
            return;
        }
        setError('');

        fetch(`/api/cycle-day-types/${type.id}`, { method: 'DELETE'})
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => {
                        throw new Error(text || 'Could not delete type');
                    });
                }
                onCycleDayTypesChange(cycleDayTypes.filter(t => t.id !== type.id));
                onTypeDeleted(type.id);
            })
            .catch(err => setError(err.message));
    };

    const handleSymptomDelete = (symptom) => {
        if(!window.confirm(`Remove "${symptom.name}" from your active symptoms?`)) {
            return;
        }
        setSymptomError('');

        fetch(`/api/symptom-types/${symptom.id}`, {method: 'DELETE'})
            .then(res => {
                if(!res.ok) {
                    return res.text().then(text => {
                        throw new Error(text || 'Could not remove symptom');
                    });
                }
                onSymptomTypesChange(symptomTypes.filter(s => s.id !== symptom.id));
            })
            .catch(err => setSymptomError(err.message));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = allCycleDayTypes.findIndex(t => t.id === active.id);
        const newIndex = allCycleDayTypes.findIndex(t => t.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(allCycleDayTypes, oldIndex, newIndex);
        setAllCycleDayTypes(reordered);
        onCycleDayTypesChange(reordered.filter(t => t.active));

        fetch('/api/cycle-day-types/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds: reordered.map(t => t.id) }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Could not reorder');
            })
            .catch(err => {
                setError(err.message);
                refreshFromServer();
            });
    };

    const handleSymptomDragEnd = (event) => {
        const {active, over} = event;
        if(!over || active.id === over.id) return;

        const oldIndex = allSymptomTypes.findIndex(s => s.id === active.id);
        const newIndex = allSymptomTypes.findIndex(s => s.id === over.id);
        if(oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(allSymptomTypes, oldIndex, newIndex);
        setAllSymptomTypes(reordered);
        onSymptomTypesChange(reordered.filter(s => s.active));

        fetch('/api/symptom-types/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ orderedIds: reordered.map(s => s.id)}),
        })
            .then(res => {
                if(!res.ok) throw new Error('Could not reorder symptoms');
            })
            .catch(err => {
                setSymptomError(err.message);
                refreshSymptomsFromServer();
            });
    };

    return (
        <div className="w-full max-w-2xl mx-auto self-start">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Customize
            </h2>

            <section>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Cycle day types
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Drag the dots to reorder. Higher items can show first on the calendar later.
                    You must keep at least one type.
                </p>

                {error && (
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={cycleDayTypes.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-2 mb-4">
                            {allCycleDayTypes.map(type => (
                                <SortableTypeRow 
                                    key={type.id}
                                    type={type}
                                    canDelete={cycleDayTypes.length > 1}
                                    onNameBlur={handleNameBlur}
                                    onColorChange={handleColorChange}
                                    onDelete={handleDelete}
                                    onActiveToggle={handleCycleActiveToggle}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="flex items-center gap-2 border border-dashed border-[#cfc3b3] rounded-lg px-3 py-2 bg-[#fbf8f3]">
                    <input 
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border-0 bg-transparent"
                    />
                    <input 
                        type="text"
                        placeholder="New type name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1"
                    />
                    <button
                        className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                        onClick={handleAdd}
                    >
                        Add
                    </button>
                </div>
            </section>

            <section className="mt-10">
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                    Symptoms
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    Drag to reorder. Remove hides a symptom from logging.
                </p>

                {symptomError && (
                    <p className="text-sm text-red-600 mb-3">{symptomError}</p>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSymptomDragEnd}
                >
                    <SortableContext
                        items={symptomTypes.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-2 mb-4">
                            {allSymptomTypes.map(symptom => (
                                <SortableSymptomRow 
                                    key={symptom.id}
                                    symptom={symptom}
                                    onNameBlur={handleSymptomNameBlur}
                                    onDelete={handleSymptomDelete}
                                    onActiveToggle={handleSymptomActiveToggle}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="flex flex-col gap-2 border border-dashed border-[#cfc3b3] rounded-lg px-3 py-3 bg-[#fbf8f3]">
                    <input 
                        type="text"
                        placeholder="New symptom name"
                        value={newSymptomName}
                        onChange={(e) => setNewSymptomName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1"
                    />

                    <select
                        value={newInputType}
                        onChange={(e) => setNewInputType(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1"
                    >
                        <option value="SCALE">Scale</option>
                        <option value="SINGLE_CHOICE">Single choice</option>
                        <option value="MULTI_CHOICE">Multi choice</option>
                        <option value="FREE_TEXT">Free text</option>
                    </select>

                    {newInputType === 'SCALE' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Min</label>
                            <input 
                                type="number"
                                value={newMinValue}
                                onChange={(e) => setNewMinValue(e.target.value)}
                                className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                            <label className="text-sm text-gray-600">Max</label>
                            <input 
                                type="number"
                                value={newMaxValue}
                                onChange={(e) => setNewMaxValue(e.target.value)}
                                className="w-20 border border-gray-300 rounded px-2 py-1"
                            />
                        </div>
                    )}

                    {(newInputType === 'SINGLE_CHOICE' || newInputType === 'MULTI_CHOICE') && (
                        <input 
                            type="text"
                            placeholder="Options, comma-separated (e.g. Dry, Sticky, Creamy)"
                            value={newOptionsText}
                            onChange={(e) => setNewOptionsText(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1"
                        />
                    )}

                    <button 
                        className="self-start px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                        onClick={handleAddSymptom}
                    >
                        Add symptom
                    </button>
                </div>
            </section>
        </div>
    );
}

export default CustomizePage;