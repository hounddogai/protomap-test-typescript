import * as text from "../../../../kit/text.js";
import { SenderPlan } from "./sender-plan.js";

/** How screens and exports show a sender plan. */
export class SenderPlanView {
  code: string;
  title: string;
  sourceText: string;
  maximum: string;
  reviewerText: string;
  audienceIdText: string;
  channel: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    sourceText: string,
    maximum: string,
    reviewerText: string,
    audienceIdText: string,
    channel: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.sourceText = sourceText;
    this.maximum = maximum;
    this.reviewerText = reviewerText;
    this.audienceIdText = audienceIdText;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toSenderPlanView(item: SenderPlan): SenderPlanView {
  return new SenderPlanView(
    item.code,
    item.title,
    item.source,
    item.maximum.toFixed(2),
    item.reviewer,
    item.audienceId,
    text.truncate(item.channel, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderPlanViews(items: SenderPlan[]): SenderPlanView[] {
  const views: SenderPlanView[] = [];
  for (const item of items) {
    views.push(toSenderPlanView(item));
  }
  return views;
}

export function sumSenderPlanView(view: SenderPlanView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedMaximum;
}
