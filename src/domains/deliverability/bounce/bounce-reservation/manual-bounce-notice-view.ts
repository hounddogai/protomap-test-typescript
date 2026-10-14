import * as text from "../../../../kit/text.js";
import { ManualBounceNotice } from "./manual-bounce-notice.js";

/** How screens and exports show a manual bounce notice. */
export class ManualBounceNoticeView {
  code: string;
  title: string;
  revision: string;
  openRate: string;
  country: string;
  journeyId: string;
  segmentText: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    revision: string,
    openRate: string,
    country: string,
    journeyId: string,
    segmentText: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.openRate = openRate;
    this.country = country;
    this.journeyId = journeyId;
    this.segmentText = segmentText;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toManualBounceNoticeView(item: ManualBounceNotice): ManualBounceNoticeView {
  return new ManualBounceNoticeView(
    item.code,
    text.truncate(item.title, 120),
    String(item.revision),
    item.openRate.toFixed(2),
    text.truncate(item.country, 120),
    text.truncate(item.journeyId, 120),
    item.segment,
    item.utmSource,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBounceNoticeViews(items: ManualBounceNotice[]): ManualBounceNoticeView[] {
  const views: ManualBounceNoticeView[] = [];
  for (const item of items) {
    views.push(toManualBounceNoticeView(item));
  }
  return views;
}

export function sumManualBounceNoticeView(view: ManualBounceNoticeView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedRevision + parsedOpenRate;
}
