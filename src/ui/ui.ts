import { FPSCounter } from "./ui_fps";
import { UIHTMLElement } from "./ui_html_element";
import { UIItems } from "./ui_items";

export class GameUI {
    m_active: boolean = true;

    m_fps: FPSCounter;
    m_items: UIItems;
    m_pause_screen: UIHTMLElement;
    m_loading: UIHTMLElement;

    assign_fps_element(html_id: string) {
        this.m_fps = new FPSCounter(html_id);
    }

    assign_count_elements(total_id: string, visible_id: string) {
        this.m_items = new UIItems(total_id, visible_id);
    }

    assign_pause_screen(html_id: string) {
        this.m_pause_screen = new UIHTMLElement(html_id);
    }

    assign_loading(html_id: string) {
        this.m_loading = new UIHTMLElement(html_id);
    }

    update_count_values(total: number, visible: number) {
        if(this.m_items) {
            this.m_items.update_values(total, visible);
        }
    }

    on_pause() {
        this.m_pause_screen.show();
    }

    off_pause() {
        this.m_pause_screen.hide();
    }

    loading_hide() {
        this.m_loading.hide();
    }

    update(dt: number) {
        if(this.m_active) {
            this.m_fps.update(dt);
        }
    }
}