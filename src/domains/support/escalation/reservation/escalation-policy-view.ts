import * as text from "../../../../kit/text.js";
import { EscalationPolicy } from "./escalation-policy.js";

/** How screens and exports show a escalation policy. */
export class EscalationPolicyView {
  codeText: string;
  name: string;
  externalRefText: string;
  audienceIdText: string;
  sequence: string;
  startsAt: string;
  sendAtText: string;
  reviewerText: string;
  revision: string;
  priorityText: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    externalRefText: string,
    audienceIdText: string,
    sequence: string,
    startsAt: string,
    sendAtText: string,
    reviewerText: string,
    revision: string,
    priorityText: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.externalRefText = externalRefText;
    this.audienceIdText = audienceIdText;
    this.sequence = sequence;
    this.startsAt = startsAt;
    this.sendAtText = sendAtText;
    this.reviewerText = reviewerText;
    this.revision = revision;
    this.priorityText = priorityText;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationPolicyView(item: EscalationPolicy): EscalationPolicyView {
  return new EscalationPolicyView(
    item.code,
    item.name,
    item.externalRef,
    text.truncate(item.audienceId, 80),
    String(item.sequence),
    String(item.startsAt),
    String(item.sendAt),
    item.reviewer,
    String(item.revision),
    String(item.priority),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationPolicyViews(items: EscalationPolicy[]): EscalationPolicyView[] {
  const views: EscalationPolicyView[] = [];
  for (const item of items) {
    views.push(toEscalationPolicyView(item));
  }
  return views;
}

export function sumEscalationPolicyView(view: EscalationPolicyView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedSequence + parsedStartsAt + parsedSendAt;
}
