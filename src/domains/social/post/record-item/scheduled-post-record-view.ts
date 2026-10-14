import * as text from "../../../../kit/text.js";
import { ScheduledPostRecord } from "./scheduled-post-record.js";

/** How screens and exports show a scheduled post record. */
export class ScheduledPostRecordView {
  codeText: string;
  labelText: string;
  batchSize: string;
  openRate: string;
  campaignRef: string;
  frequencyCapText: string;
  checksum: string;
  timezone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    batchSize: string,
    openRate: string,
    campaignRef: string,
    frequencyCapText: string,
    checksum: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.frequencyCapText = frequencyCapText;
    this.checksum = checksum;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPostRecordView(item: ScheduledPostRecord): ScheduledPostRecordView {
  return new ScheduledPostRecordView(
    item.code,
    text.truncate(item.label, 80),
    String(item.batchSize),
    item.openRate.toFixed(2),
    item.campaignRef,
    String(item.frequencyCap),
    item.checksum,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPostRecordViews(items: ScheduledPostRecord[]): ScheduledPostRecordView[] {
  const views: ScheduledPostRecordView[] = [];
  for (const item of items) {
    views.push(toScheduledPostRecordView(item));
  }
  return views;
}

export function sumScheduledPostRecordView(view: ScheduledPostRecordView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedBatchSize + parsedOpenRate + parsedFrequencyCap;
}
