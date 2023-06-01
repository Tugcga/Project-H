export function click_coordinates(canvas: HTMLCanvasElement, mouse_event: MouseEvent): number[] {
    const canvas_rect = canvas.getBoundingClientRect()
    return [mouse_event.clientX - canvas_rect.left, mouse_event.clientY - canvas_rect.top];
}