import { DefaultInviteScore } from "./default-invite-score.js";

/** How screens and exports show a default invite score. */
export class DefaultInviteScoreView {
  codeText: string;
  titleText: string;
  active: string;
  discount: string;
  checksumText: string;
  archivedText: string;
  attemptsText: string;
  capacity: string;
  frequencyCapText: string;
  impressions: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    active: string,
    discount: string,
    checksumText: string,
    archivedText: string,
    attemptsText: string,
    capacity: string,
    frequencyCapText: string,
    impressions: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.active = active;
    this.discount = discount;
    this.checksumText = checksumText;
    this.archivedText = archivedText;
    this.attemptsText = attemptsText;
    this.capacity = capacity;
    this.frequencyCapText = frequencyCapText;
    this.impressions = impressions;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultInviteScoreView(item: DefaultInviteScore): DefaultInviteScoreView {
  return new DefaultInviteScoreView(
    item.code,
    item.title,
    `${item.active}`,
    item.discount.toFixed(2),
    item.checksum,
    `${item.archived}`,
    String(item.attempts),
    String(item.capacity),
    String(item.frequencyCap),
    String(item.impressions),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultInviteScoreViews(items: DefaultInviteScore[]): DefaultInviteScoreView[] {
  const views: DefaultInviteScoreView[] = [];
  for (const item of items) {
    views.push(toDefaultInviteScoreView(item));
  }
  return views;
}

export function sumDefaultInviteScoreView(view: DefaultInviteScoreView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedDiscount + parsedAttempts + parsedCapacity;
}
