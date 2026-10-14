import { PrimaryDomainSchedule } from "./primary-domain-schedule.js";

/** How screens and exports show a primary domain schedule. */
export class PrimaryDomainScheduleView {
  codeText: string;
  titleText: string;
  channelText: string;
  audienceIdText: string;
  amount: string;
  sequenceText: string;
  approved: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    channelText: string,
    audienceIdText: string,
    amount: string,
    sequenceText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.channelText = channelText;
    this.audienceIdText = audienceIdText;
    this.amount = amount;
    this.sequenceText = sequenceText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryDomainScheduleView(item: PrimaryDomainSchedule): PrimaryDomainScheduleView {
  return new PrimaryDomainScheduleView(
    item.code,
    item.title,
    item.channel,
    item.audienceId,
    item.amount.toFixed(2),
    String(item.sequence),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryDomainScheduleViews(items: PrimaryDomainSchedule[]): PrimaryDomainScheduleView[] {
  const views: PrimaryDomainScheduleView[] = [];
  for (const item of items) {
    views.push(toPrimaryDomainScheduleView(item));
  }
  return views;
}

export function sumPrimaryDomainScheduleView(view: PrimaryDomainScheduleView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedAmount + parsedSequence;
}
