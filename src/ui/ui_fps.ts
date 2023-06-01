import { UIHTMLTextElement } from "./ui_html_text_element";

export class FPSCounter extends UIHTMLTextElement {
    m_accumulator: number = 0.0;
    m_ticks: number = 0;
    m_value: number = 0.0;

    constructor(html_id: string) {
        super(html_id);


    }

    update(dt: number) {
        // update fps counter
        // calculate fps
        this.m_accumulator += dt;
        this.m_ticks += 1;

        if(this.m_accumulator > 2.0) {
            this.m_value = this.m_ticks / this.m_accumulator;

            // reset fps value
            this.m_accumulator = 0.0;
            this.m_ticks = 0;

            this.set_text((Math.round(this.m_value * 100) / 100).toFixed(2).toString());
        }
    }
}