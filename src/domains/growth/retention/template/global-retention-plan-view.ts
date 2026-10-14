import * as text from "../../../../kit/text.js";
import { GlobalRetentionPlan } from "./global-retention-plan.js";

/** How screens and exports show a global retention plan. */
export class GlobalRetentionPlanView {
  codeText: string;
  nameText: string;
  capacity: string;
  channelText: string;
  score: string;
  sendAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    capacity: string,
    channelText: string,
    score: string,
    sendAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.capacity = capacity;
    this.channelText = channelText;
    this.score = score;
    this.sendAtText = sendAtText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalRetentionPlanView(item: GlobalRetentionPlan): GlobalRetentionPlanView {
  return new GlobalRetentionPlanView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.capacity),
    item.channel,
    item.score.toFixed(2),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalRetentionPlanViews(items: GlobalRetentionPlan[]): GlobalRetentionPlanView[] {
  const views: GlobalRetentionPlanView[] = [];
  for (const item of items) {
    views.push(toGlobalRetentionPlanView(item));
  }
  return views;
}

export function sumGlobalRetentionPlanView(view: GlobalRetentionPlanView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedCapacity + parsedScore + parsedSendAt;
}
