import { RedemptionNotice } from "./redemption-notice.js";

/** How screens and exports show a redemption notice. */
export class RedemptionNoticeView {
  codeText: string;
  name: string;
  version: string;
  pinned: string;
  sequenceText: string;
  ceilingText: string;
  openRateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    version: string,
    pinned: string,
    sequenceText: string,
    ceilingText: string,
    openRateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.version = version;
    this.pinned = pinned;
    this.sequenceText = sequenceText;
    this.ceilingText = ceilingText;
    this.openRateText = openRateText;
    this.statusLabel = statusLabel;
  }
}

export function toRedemptionNoticeView(item: RedemptionNotice): RedemptionNoticeView {
  return new RedemptionNoticeView(
    item.code,
    item.name,
    String(item.version),
    `${item.pinned}`,
    String(item.sequence),
    item.ceiling.toFixed(2),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRedemptionNoticeViews(items: RedemptionNotice[]): RedemptionNoticeView[] {
  const views: RedemptionNoticeView[] = [];
  for (const item of items) {
    views.push(toRedemptionNoticeView(item));
  }
  return views;
}

export function sumRedemptionNoticeView(view: RedemptionNoticeView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedVersion + parsedSequence + parsedCeiling;
}
