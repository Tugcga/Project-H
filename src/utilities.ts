export function cursor_coordinates(canvas: HTMLCanvasElement, mouse_event: MouseEvent): number[] {
    const canvas_rect = canvas.getBoundingClientRect();
    return [mouse_event.clientX - canvas_rect.left, mouse_event.clientY - canvas_rect.top];
}

export function touch_coordinates(canvas: HTMLCanvasElement, touch_event: TouchEvent): number[] {
    const canvas_rect = canvas.getBoundingClientRect();
    const touches = touch_event.touches;
    if (touches && touches.length > 0) {
        return [touch_event.touches[0].clientX - canvas_rect.left, touch_event.touches[0].clientY - canvas_rect.top];
    } else {
        return [];
    }
}