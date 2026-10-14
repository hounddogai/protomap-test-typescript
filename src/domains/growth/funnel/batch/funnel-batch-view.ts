import * as text from "../../../../kit/text.js";
import { FunnelBatch } from "./funnel-batch.js";

/** How screens and exports show a funnel batch. */
export class FunnelBatchView {
  codeText: string;
  name: string;
  startsAt: string;
  utmSourceText: string;
  ownerId: string;
  archived: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    startsAt: string,
    utmSourceText: string,
    ownerId: string,
    archived: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.startsAt = startsAt;
    this.utmSourceText = utmSourceText;
    this.ownerId = ownerId;
    this.archived = archived;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelBatchView(item: FunnelBatch): FunnelBatchView {
  return new FunnelBatchView(
    text.truncate(item.code, 64),
    item.name,
    String(item.startsAt),
    text.truncate(item.utmSource, 80),
    text.truncate(item.ownerId, 64),
    `${item.archived}`,
    item.country,
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelBatchViews(items: FunnelBatch[]): FunnelBatchView[] {
  const views: FunnelBatchView[] = [];
  for (const item of items) {
    views.push(toFunnelBatchView(item));
  }
  return views;
}

export function sumFunnelBatchView(view: FunnelBatchView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
