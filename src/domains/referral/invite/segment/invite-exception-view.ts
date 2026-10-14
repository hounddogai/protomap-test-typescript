import * as text from "../../../../kit/text.js";
import { InviteException } from "./invite-exception.js";

/** How screens and exports show a invite exception. */
export class InviteExceptionView {
  codeText: string;
  name: string;
  capacity: string;
  expiresAt: string;
  createdAtText: string;
  campaignRef: string;
  limit: string;
  score: string;
  descriptionText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    capacity: string,
    expiresAt: string,
    createdAtText: string,
    campaignRef: string,
    limit: string,
    score: string,
    descriptionText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.capacity = capacity;
    this.expiresAt = expiresAt;
    this.createdAtText = createdAtText;
    this.campaignRef = campaignRef;
    this.limit = limit;
    this.score = score;
    this.descriptionText = descriptionText;
    this.statusLabel = statusLabel;
  }
}

export function toInviteExceptionView(item: InviteException): InviteExceptionView {
  return new InviteExceptionView(
    item.code,
    item.name,
    String(item.capacity),
    String(item.expiresAt),
    String(item.createdAt),
    text.truncate(item.campaignRef, 64),
    String(item.limit),
    item.score.toFixed(2),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteExceptionViews(items: InviteException[]): InviteExceptionView[] {
  const views: InviteExceptionView[] = [];
  for (const item of items) {
    views.push(toInviteExceptionView(item));
  }
  return views;
}

export function sumInviteExceptionView(view: InviteExceptionView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedCapacity + parsedExpiresAt + parsedCreatedAt;
}
