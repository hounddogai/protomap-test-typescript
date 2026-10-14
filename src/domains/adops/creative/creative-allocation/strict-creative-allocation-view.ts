import * as text from "../../../../kit/text.js";
import { StrictCreativeAllocation } from "./strict-creative-allocation.js";

/** How screens and exports show a strict creative allocation. */
export class StrictCreativeAllocationView {
  code: string;
  title: string;
  attempts: string;
  campaignRefText: string;
  audienceId: string;
  approvedText: string;
  journeyIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    attempts: string,
    campaignRefText: string,
    audienceId: string,
    approvedText: string,
    journeyIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.campaignRefText = campaignRefText;
    this.audienceId = audienceId;
    this.approvedText = approvedText;
    this.journeyIdText = journeyIdText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeAllocationView(item: StrictCreativeAllocation): StrictCreativeAllocationView {
  return new StrictCreativeAllocationView(
    item.code,
    item.title,
    String(item.attempts),
    item.campaignRef,
    text.truncate(item.audienceId, 120),
    `${item.approved}`,
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeAllocationViews(items: StrictCreativeAllocation[]): StrictCreativeAllocationView[] {
  const views: StrictCreativeAllocationView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeAllocationView(item));
  }
  return views;
}

export function sumStrictCreativeAllocationView(view: StrictCreativeAllocationView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAttempts;
}
