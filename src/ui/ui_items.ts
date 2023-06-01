import { UIHTMLTextElement } from "./ui_html_text_element";

export class UIItems {
    m_total_element: UIHTMLTextElement;
    m_visible_element: UIHTMLTextElement;

    constructor(total_id: string, visible_id: string) {
        this.m_total_element = new UIHTMLTextElement(total_id);
        this.m_visible_element = new UIHTMLTextElement(visible_id);
    }

    update_values(total: number, visible: number) {
        if(this.m_total_element) {
            this.m_total_element.set_text(total.toString());
        }

        if(this.m_visible_element) {
            this.m_visible_element.set_text(visible.toString());
        }
    }
}