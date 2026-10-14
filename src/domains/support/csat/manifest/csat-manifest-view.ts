import { CsatManifest } from "./csat-manifest.js";

/** How screens and exports show a csat manifest. */
export class CsatManifestView {
  codeText: string;
  label: string;
  updatedAt: string;
  reviewer: string;
  notes: string;
  margin: string;
  sendAt: string;
  frequencyCapText: string;
  batchSize: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    updatedAt: string,
    reviewer: string,
    notes: string,
    margin: string,
    sendAt: string,
    frequencyCapText: string,
    batchSize: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.updatedAt = updatedAt;
    this.reviewer = reviewer;
    this.notes = notes;
    this.margin = margin;
    this.sendAt = sendAt;
    this.frequencyCapText = frequencyCapText;
    this.batchSize = batchSize;
    this.statusLabel = statusLabel;
  }
}

export function toCsatManifestView(item: CsatManifest): CsatManifestView {
  return new CsatManifestView(
    item.code,
    item.label,
    String(item.updatedAt),
    item.reviewer,
    item.notes,
    item.margin.toFixed(2),
    String(item.sendAt),
    String(item.frequencyCap),
    String(item.batchSize),
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatManifestViews(items: CsatManifest[]): CsatManifestView[] {
  const views: CsatManifestView[] = [];
  for (const item of items) {
    views.push(toCsatManifestView(item));
  }
  return views;
}

export function sumCsatManifestView(view: CsatManifestView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedUpdatedAt + parsedMargin + parsedSendAt;
}
