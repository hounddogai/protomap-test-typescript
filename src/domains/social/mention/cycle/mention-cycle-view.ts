import * as text from "../../../../kit/text.js";
import { MentionCycle } from "./mention-cycle.js";

/** How screens and exports show a mention cycle. */
export class MentionCycleView {
  code: string;
  titleText: string;
  campaignRef: string;
  cohortText: string;
  archived: string;
  checksum: string;
  variant: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    campaignRef: string,
    cohortText: string,
    archived: string,
    checksum: string,
    variant: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.campaignRef = campaignRef;
    this.cohortText = cohortText;
    this.archived = archived;
    this.checksum = checksum;
    this.variant = variant;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionCycleView(item: MentionCycle): MentionCycleView {
  return new MentionCycleView(
    text.truncate(item.code, 40),
    item.title,
    item.campaignRef,
    item.cohort,
    `${item.archived}`,
    text.truncate(item.checksum, 120),
    text.truncate(item.variant, 80),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionCycleViews(items: MentionCycle[]): MentionCycleView[] {
  const views: MentionCycleView[] = [];
  for (const item of items) {
    views.push(toMentionCycleView(item));
  }
  return views;
}

export function sumMentionCycleView(view: MentionCycleView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
