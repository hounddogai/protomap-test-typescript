import * as text from "../../../../kit/text.js";
import { MentionPolicy } from "./mention-policy.js";

/** How screens and exports show a mention policy. */
export class MentionPolicyView {
  code: string;
  label: string;
  retries: string;
  ceilingText: string;
  channel: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    ceilingText: string,
    channel: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.ceilingText = ceilingText;
    this.channel = channel;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toMentionPolicyView(item: MentionPolicy): MentionPolicyView {
  return new MentionPolicyView(
    text.truncate(item.code, 40),
    item.label,
    String(item.retries),
    item.ceiling.toFixed(2),
    item.channel,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionPolicyViews(items: MentionPolicy[]): MentionPolicyView[] {
  const views: MentionPolicyView[] = [];
  for (const item of items) {
    views.push(toMentionPolicyView(item));
  }
  return views;
}

export function sumMentionPolicyView(view: MentionPolicyView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedRetries + parsedCeiling;
}
