import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  DndProvider,
  useDrag,
  useDrop,
  type ConnectDragSource,
} from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ArrowUpDown, GripVertical, X } from "lucide-react";
import Select, { type MultiValue, type ActionMeta } from "react-select";
import type { Identifier, XYCoord } from "dnd-core";

// Define option type structure
interface OptionType {
  value: string;
  label: string;
}

// Item type for drag and drop
const ItemTypes = {
  ITEM: "item",
  OPTION: "option",
};

// Define the item structure for dragging
interface DragItem {
  id: string;
  index: number;
  type: string; // Ensure type is part of the item
}

// Props for the draggable item
interface DraggableItemProps {
  id: string;
  label: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (id: string) => void;
}

// Draggable Item Component
const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  label,
  index,
  moveItem,
  removeItem,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: ItemTypes.OPTION,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset() as XYCoord;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.OPTION,
    item: () => {
      return { id: id, index, type: ItemTypes.OPTION };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Apply drag source ref to the div
  drag(drop(ref));
  // Note: 'preview' ref is typically used with DragLayer for custom previews.
  // If default preview is fine, just applying drag(drop(ref)) is sufficient.
  // If you need preview(drag(drop(ref))), ensure the type compatibility or use DragLayer.

  const opacity = isDragging ? 0.4 : 1;

  return (
    <div
      ref={ref} // Combined drag and drop ref
      style={{ opacity }}
      data-handler-id={handlerId}
      className="mb-2 flex cursor-move items-center justify-between rounded border bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700"
    >
      <div className="flex items-center flex-grow">
        <GripVertical className="h-4 w-4 mr-2 text-gray-500" />
        <span className="text-sm text-gray-800">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => removeItem(id)}
        className="p-1 text-gray-400 hover:text-red-600"
        aria-label={`Remove ${label}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Props for the MultiSelect component
interface MultiSelectProps<TFormValues extends FieldValues> {
  id?: string;
  name: FieldPath<TFormValues>;
  control: Control<TFormValues>;
  options: OptionType[];
  label: string;
  error?: string;
  className?: string;
}

// MultiSelect Component with Drag and Drop Reordering
function MultiSelect<TFormValues extends FieldValues>({
  id,
  name,
  control,
  options,
  label,
  error,
  className,
}: MultiSelectProps<TFormValues>) {
  const { field } = useController({ name, control });
  const selectId = id || name;

  // State for selected values (maintaining order)
  const [selectedValues, setSelectedValues] = useState<OptionType[]>(() => {
    const currentFieldValue = field.value as string[] | undefined;
    if (!currentFieldValue) return [];
    // Map initial values from form state to options, preserving order
    return currentFieldValue
      .map((val) => options.find((opt) => opt.value === val))
      .filter((opt): opt is OptionType => !!opt);
  });

  // Sync with react-hook-form value if it changes externally
  useEffect(() => {
    const formValue = field.value as string[] | undefined | OptionType[];
    if (JSON.stringify(selectedValues) !== JSON.stringify(field.value)) {
      setSelectedValues(field.value || []);
    }
  }, [field.value, selectedValues, field.onChange]);

  // Update form state when selectedValues change
  useEffect(() => {
    field.onChange(selectedValues.map((opt) => opt.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValues]); // Omit field.onChange from deps as it's stable

  // Handle change from react-select
  const handleChange = (
    newValue: MultiValue<OptionType>,
    actionMeta: ActionMeta<OptionType>
  ) => {
    // Update selectedValues based on react-select changes
    // This keeps the dropdown consistent but doesn't affect the ordered list directly yet.
    // Ordering is handled by drag-and-drop.
    setSelectedValues(newValue as OptionType[]);
  };

  // Move item in the ordered list
  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setSelectedValues((prev) => {
      const newValues = [...prev];
      const [movedItem] = newValues.splice(dragIndex, 1);
      newValues.splice(hoverIndex, 0, movedItem);
      return newValues;
    });
  }, []);

  // Remove item from the ordered list
  const removeItem = useCallback((idToRemove: string) => {
    setSelectedValues((prev) =>
      prev.filter((item) => item.value !== idToRemove)
    );
  }, []);

  // Get options available for selection (those not already selected)
  const availableOptions = options.filter(
    (opt) => !selectedValues.some((selected) => selected.value === opt.value)
  );

  return (
    <div className={className} id={id}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Select
        isMulti
        options={availableOptions} // Only show unselected options
        onChange={handleChange}
        // Controlled value based on ordered list (for display consistency in Select box)
        value={selectedValues}
        placeholder="Select models..."
        className="mb-3"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: error ? "#EF4444" : base.borderColor,
          }),
        }}
      />

      <div className="min-h-[100px] rounded border border-dashed p-2 dark:border-gray-600">
        {selectedValues.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Drag items here to select
          </p>
        )}
        <DndProvider backend={HTML5Backend}>
          {selectedValues.map((option, index) => (
            <DraggableItem
              key={option.value}
              id={option.value}
              label={option.label}
              index={index}
              moveItem={moveItem}
              removeItem={removeItem}
            />
          ))}
        </DndProvider>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default MultiSelect;
