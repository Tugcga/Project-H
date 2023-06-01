import { UIElement } from "./ui_element";

export class UIHTMLElement extends UIElement {
    m_html_element: HTMLElement | null;

    constructor(html_id: string) {
        super();

        this.m_html_element = document.getElementById(html_id);
    }

    show() {
        if(this.m_html_element) {
            this.m_html_element.style.visibility = "visible";
        }
    }

    hide() {
        if(this.m_html_element) {
            this.m_html_element.style.visibility = "hidden";
        }
    }
}