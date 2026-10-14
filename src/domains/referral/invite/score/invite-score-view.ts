import * as text from "../../../../kit/text.js";
import { InviteScore } from "./invite-score.js";

/** How screens and exports show a invite score. */
export class InviteScoreView {
  code: string;
  title: string;
  checksumText: string;
  journeyId: string;
  cost: string;
  createdAtText: string;
  minimumText: string;
  audienceId: string;
  expiresAtText: string;
  descriptionText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    checksumText: string,
    journeyId: string,
    cost: string,
    createdAtText: string,
    minimumText: string,
    audienceId: string,
    expiresAtText: string,
    descriptionText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.checksumText = checksumText;
    this.journeyId = journeyId;
    this.cost = cost;
    this.createdAtText = createdAtText;
    this.minimumText = minimumText;
    this.audienceId = audienceId;
    this.expiresAtText = expiresAtText;
    this.descriptionText = descriptionText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toInviteScoreView(item: InviteScore): InviteScoreView {
  return new InviteScoreView(
    item.code,
    text.truncate(item.title, 80),
    item.checksum,
    item.journeyId,
    item.cost.toFixed(2),
    String(item.createdAt),
    item.minimum.toFixed(2),
    item.audienceId,
    String(item.expiresAt),
    item.description,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toInviteScoreViews(items: InviteScore[]): InviteScoreView[] {
  const views: InviteScoreView[] = [];
  for (const item of items) {
    views.push(toInviteScoreView(item));
  }
  return views;
}

export function sumInviteScoreView(view: InviteScoreView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedCost + parsedCreatedAt + parsedMinimum;
}
