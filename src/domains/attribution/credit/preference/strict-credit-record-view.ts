import { StrictCreditRecord } from "./strict-credit-record.js";

/** How screens and exports show a strict credit record. */
export class StrictCreditRecordView {
  codeText: string;
  title: string;
  frequencyCap: string;
  attempts: string;
  priorityText: string;
  channel: string;
  revision: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    frequencyCap: string,
    attempts: string,
    priorityText: string,
    channel: string,
    revision: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.attempts = attempts;
    this.priorityText = priorityText;
    this.channel = channel;
    this.revision = revision;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreditRecordView(item: StrictCreditRecord): StrictCreditRecordView {
  return new StrictCreditRecordView(
    item.code,
    item.title,
    String(item.frequencyCap),
    String(item.attempts),
    String(item.priority),
    item.channel,
    String(item.revision),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreditRecordViews(items: StrictCreditRecord[]): StrictCreditRecordView[] {
  const views: StrictCreditRecordView[] = [];
  for (const item of items) {
    views.push(toStrictCreditRecordView(item));
  }
  return views;
}

export function sumStrictCreditRecordView(view: StrictCreditRecordView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedFrequencyCap + parsedAttempts + parsedPriority;
}
