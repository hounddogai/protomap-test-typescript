import * as text from "../../../../kit/text.js";
import { PendingChallengeTemplate } from "./pending-challenge-template.js";

/** How screens and exports show a pending challenge template. */
export class PendingChallengeTemplateView {
  code: string;
  nameText: string;
  ownerId: string;
  segment: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ownerId: string,
    segment: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ownerId = ownerId;
    this.segment = segment;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toPendingChallengeTemplateView(item: PendingChallengeTemplate): PendingChallengeTemplateView {
  return new PendingChallengeTemplateView(
    item.code,
    item.name,
    item.ownerId,
    text.truncate(item.segment, 120),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingChallengeTemplateViews(items: PendingChallengeTemplate[]): PendingChallengeTemplateView[] {
  const views: PendingChallengeTemplateView[] = [];
  for (const item of items) {
    views.push(toPendingChallengeTemplateView(item));
  }
  return views;
}

export function sumPendingChallengeTemplateView(view: PendingChallengeTemplateView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedRetries;
}
