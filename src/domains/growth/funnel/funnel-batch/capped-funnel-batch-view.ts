import * as text from "../../../../kit/text.js";
import { CappedFunnelBatch } from "./capped-funnel-batch.js";

/** How screens and exports show a capped funnel batch. */
export class CappedFunnelBatchView {
  codeText: string;
  nameText: string;
  visibleText: string;
  createdAt: string;
  title: string;
  clicks: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    visibleText: string,
    createdAt: string,
    title: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.visibleText = visibleText;
    this.createdAt = createdAt;
    this.title = title;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFunnelBatchView(item: CappedFunnelBatch): CappedFunnelBatchView {
  return new CappedFunnelBatchView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    `${item.visible}`,
    String(item.createdAt),
    text.truncate(item.title, 80),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFunnelBatchViews(items: CappedFunnelBatch[]): CappedFunnelBatchView[] {
  const views: CappedFunnelBatchView[] = [];
  for (const item of items) {
    views.push(toCappedFunnelBatchView(item));
  }
  return views;
}

export function sumCappedFunnelBatchView(view: CappedFunnelBatchView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedCreatedAt + parsedClicks;
}
