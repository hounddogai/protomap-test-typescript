import * as text from "../../../../kit/text.js";
import { ModelTemplate } from "./model-template.js";

/** How screens and exports show a model template. */
export class ModelTemplateView {
  codeText: string;
  name: string;
  graceDays: string;
  revision: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    graceDays: string,
    revision: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.graceDays = graceDays;
    this.revision = revision;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toModelTemplateView(item: ModelTemplate): ModelTemplateView {
  return new ModelTemplateView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 80),
    String(item.graceDays),
    String(item.revision),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelTemplateViews(items: ModelTemplate[]): ModelTemplateView[] {
  const views: ModelTemplateView[] = [];
  for (const item of items) {
    views.push(toModelTemplateView(item));
  }
  return views;
}

export function sumModelTemplateView(view: ModelTemplateView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedGraceDays + parsedRevision;
}
