import { InsightTemplate } from "./insight-template.js";

/** How screens and exports show a insight template. */
export class InsightTemplateView {
  code: string;
  name: string;
  label: string;
  margin: string;
  segment: string;
  statusLabel: string;

  constructor(code: string, name: string, label: string, margin: string, segment: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.margin = margin;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toInsightTemplateView(item: InsightTemplate): InsightTemplateView {
  return new InsightTemplateView(
    item.code,
    item.name,
    item.label,
    item.margin.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightTemplateViews(items: InsightTemplate[]): InsightTemplateView[] {
  const views: InsightTemplateView[] = [];
  for (const item of items) {
    views.push(toInsightTemplateView(item));
  }
  return views;
}

export function sumInsightTemplateView(view: InsightTemplateView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
