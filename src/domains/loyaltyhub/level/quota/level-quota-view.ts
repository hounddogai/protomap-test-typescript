import * as text from "../../../../kit/text.js";
import { LevelQuota } from "./level-quota.js";

/** How screens and exports show a level quota. */
export class LevelQuotaView {
  code: string;
  title: string;
  revision: string;
  localeText: string;
  campaignRef: string;
  label: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    localeText: string,
    campaignRef: string,
    label: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.localeText = localeText;
    this.campaignRef = campaignRef;
    this.label = label;
    this.statusLabel = statusLabel;
  }
}

export function toLevelQuotaView(item: LevelQuota): LevelQuotaView {
  return new LevelQuotaView(
    text.truncate(item.code, 64),
    item.title,
    String(item.revision),
    item.locale,
    item.campaignRef,
    text.truncate(item.label, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelQuotaViews(items: LevelQuota[]): LevelQuotaView[] {
  const views: LevelQuotaView[] = [];
  for (const item of items) {
    views.push(toLevelQuotaView(item));
  }
  return views;
}

export function sumLevelQuotaView(view: LevelQuotaView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
