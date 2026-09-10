import { useState } from "react";
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

function SortableTypeRow({ type, canDelete, onNameBlur, onColorChange, onDelete }) {
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
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white"
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

function CustomizePage({ cycleDayTypes, onCycleDayTypesChange, onTypeUpdated, onTypeDeleted}) {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#cccccc');
    const [error, setError] = useState('');

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

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = cycleDayTypes.findIndex(t => t.id === active.id);
        const newIndex = cycleDayTypes.findIndex(t => t.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const reordered = arrayMove(cycleDayTypes, oldIndex, newIndex);
        onCycleDayTypesChange(reordered);

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
                            {cycleDayTypes.map(type => (
                                <SortableTypeRow 
                                    key={type.id}
                                    type={type}
                                    canDelete={cycleDayTypes.length > 1}
                                    onNameBlur={handleNameBlur}
                                    onColorChange={handleColorChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2">
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
        </div>
    );
}

export default CustomizePage;