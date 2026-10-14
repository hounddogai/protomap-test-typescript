import * as text from "../../../../kit/text.js";
import { SenderQuota } from "./sender-quota.js";

/** How screens and exports show a sender quota. */
export class SenderQuotaView {
  codeText: string;
  label: string;
  startsAt: string;
  summary: string;
  cohort: string;
  checksumText: string;
  name: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    startsAt: string,
    summary: string,
    cohort: string,
    checksumText: string,
    name: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.startsAt = startsAt;
    this.summary = summary;
    this.cohort = cohort;
    this.checksumText = checksumText;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toSenderQuotaView(item: SenderQuota): SenderQuotaView {
  return new SenderQuotaView(
    text.truncate(item.code, 120),
    item.label,
    String(item.startsAt),
    item.summary,
    item.cohort,
    item.checksum,
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderQuotaViews(items: SenderQuota[]): SenderQuotaView[] {
  const views: SenderQuotaView[] = [];
  for (const item of items) {
    views.push(toSenderQuotaView(item));
  }
  return views;
}

export function sumSenderQuotaView(view: SenderQuotaView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
