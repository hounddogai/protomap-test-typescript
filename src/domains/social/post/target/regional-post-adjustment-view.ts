import { RegionalPostAdjustment } from "./regional-post-adjustment.js";

/** How screens and exports show a regional post adjustment. */
export class RegionalPostAdjustmentView {
  codeText: string;
  label: string;
  rate: string;
  retriesText: string;
  title: string;
  version: string;
  discount: string;
  audienceId: string;
  notesText: string;
  weightText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    rate: string,
    retriesText: string,
    title: string,
    version: string,
    discount: string,
    audienceId: string,
    notesText: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.rate = rate;
    this.retriesText = retriesText;
    this.title = title;
    this.version = version;
    this.discount = discount;
    this.audienceId = audienceId;
    this.notesText = notesText;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPostAdjustmentView(item: RegionalPostAdjustment): RegionalPostAdjustmentView {
  return new RegionalPostAdjustmentView(
    item.code,
    item.label,
    item.rate.toFixed(2),
    String(item.retries),
    item.title,
    String(item.version),
    item.discount.toFixed(2),
    item.audienceId,
    item.notes,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPostAdjustmentViews(items: RegionalPostAdjustment[]): RegionalPostAdjustmentView[] {
  const views: RegionalPostAdjustmentView[] = [];
  for (const item of items) {
    views.push(toRegionalPostAdjustmentView(item));
  }
  return views;
}

export function sumRegionalPostAdjustmentView(view: RegionalPostAdjustmentView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedRate + parsedRetries + parsedVersion;
}
