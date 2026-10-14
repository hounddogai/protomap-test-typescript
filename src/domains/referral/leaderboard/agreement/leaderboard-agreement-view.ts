import * as text from "../../../../kit/text.js";
import { LeaderboardAgreement } from "./leaderboard-agreement.js";

/** How screens and exports show a leaderboard agreement. */
export class LeaderboardAgreementView {
  code: string;
  name: string;
  category: string;
  approvedText: string;
  phone: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    category: string,
    approvedText: string,
    phone: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.approvedText = approvedText;
    this.phone = phone;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toLeaderboardAgreementView(item: LeaderboardAgreement): LeaderboardAgreementView {
  return new LeaderboardAgreementView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.category, 64),
    `${item.approved}`,
    item.phone,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLeaderboardAgreementViews(items: LeaderboardAgreement[]): LeaderboardAgreementView[] {
  const views: LeaderboardAgreementView[] = [];
  for (const item of items) {
    views.push(toLeaderboardAgreementView(item));
  }
  return views;
}

export function sumLeaderboardAgreementView(view: LeaderboardAgreementView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
