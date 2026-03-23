import { PointerSensor, PointerSensorOptions } from '@dnd-kit/core';

/**
 * Custom pointer sensor that only activates on the drag handle
 * This allows drag-select to work on empty canvas, and drag-and-drop on block handles
 */
export class ConditionalPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: any) => {
        // Only activate on left mouse button
        if (event.button !== 0) {
          return false;
        }
        
        // Only activate if clicking on a drag handle (has the drag listeners)
        const target = event.target as HTMLElement;
        const isDragHandle = target.closest('[aria-label="Drag handle to move block"]');
        
        if (!isDragHandle) {
          return false;
        }
        
        return true;
      },
    },
  ];
}
