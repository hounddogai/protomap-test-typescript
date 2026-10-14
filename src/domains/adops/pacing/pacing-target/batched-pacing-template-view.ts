import * as text from "../../../../kit/text.js";
import { BatchedPacingTemplate } from "./batched-pacing-template.js";

/** How screens and exports show a batched pacing template. */
export class BatchedPacingTemplateView {
  code: string;
  label: string;
  sourceText: string;
  margin: string;
  statusLabel: string;

  constructor(code: string, label: string, sourceText: string, margin: string, statusLabel: string) {
    this.code = code;
    this.label = label;
    this.sourceText = sourceText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedPacingTemplateView(item: BatchedPacingTemplate): BatchedPacingTemplateView {
  return new BatchedPacingTemplateView(
    item.code,
    item.label,
    text.truncate(item.source, 64),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedPacingTemplateViews(items: BatchedPacingTemplate[]): BatchedPacingTemplateView[] {
  const views: BatchedPacingTemplateView[] = [];
  for (const item of items) {
    views.push(toBatchedPacingTemplateView(item));
  }
  return views;
}

export function sumBatchedPacingTemplateView(view: BatchedPacingTemplateView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
