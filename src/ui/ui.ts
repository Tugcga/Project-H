import { FPSCounter } from "./ui_fps";
import { UIHTMLElement } from "./ui_html_element";
import { UIHTMLTextElement } from "./ui_html_text_element";
import { UIItems } from "./ui_items";

export class GameUI {
    m_active: boolean = true;

    m_fps: FPSCounter;
    m_items: UIItems;
    m_pause_screen: UIHTMLElement;
    m_loading: UIHTMLElement;
    m_control_keyboard: UIHTMLElement;
    m_control_touch: UIHTMLElement;
    m_position: UIHTMLTextElement;

    assign_fps_element(html_id: string) {
        this.m_fps = new FPSCounter(html_id);
    }

    assign_count_elements(total_id: string, visible_id: string) {
        this.m_items = new UIItems(total_id, visible_id);
    }

    assign_pause_screen(html_id: string) {
        this.m_pause_screen = new UIHTMLElement(html_id);
    }

    assign_control_keyboard(html_id: string) {
        this.m_control_keyboard = new UIHTMLElement(html_id);
    }

    assign_control_touch(html_id: string) {
        this.m_control_touch = new UIHTMLElement(html_id);
    }

    assign_loading(html_id: string) {
        this.m_loading = new UIHTMLElement(html_id);
    }

    assign_position(html_id: string) {
        this.m_position = new UIHTMLTextElement(html_id);
    }

    update_count_values(total: number, visible: number) {
        if(this.m_items) {
            this.m_items.update_values(total, visible);
        }
    }

    update_position(in_translation: number[]) {
        if (this.m_position && in_translation.length >= 2) {
            this.m_position.set_text("(" + in_translation[0].toFixed(2).toString() + ", " + in_translation[1].toFixed(2).toString() + ")");
        }
    }

    on_pause(is_touch: boolean) {
        this.m_pause_screen.show();
        if (is_touch) {
            this.m_control_touch.show();
            this.m_control_keyboard.hide();
        } else {
            this.m_control_touch.hide();
            this.m_control_keyboard.show();
        }
    }

    off_pause() {
        this.m_pause_screen.hide();
        this.m_control_keyboard.hide();
        this.m_control_touch.hide();
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