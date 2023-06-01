import { UIHTMLElement } from "./ui_html_element";

export class UIHTMLTextElement extends UIHTMLElement {
    constructor(html_id: string) {
        super(html_id);
    }

    set_text(text: string) {
        if(this.m_html_element) {
            this.m_html_element.innerText = text;
        }
    }
}