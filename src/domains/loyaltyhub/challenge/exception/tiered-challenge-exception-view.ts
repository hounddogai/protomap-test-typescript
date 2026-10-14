import * as text from "../../../../kit/text.js";
import { TieredChallengeException } from "./tiered-challenge-exception.js";

/** How screens and exports show a tiered challenge exception. */
export class TieredChallengeExceptionView {
  code: string;
  title: string;
  campaignRef: string;
  updatedAt: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    updatedAt: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.updatedAt = updatedAt;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toTieredChallengeExceptionView(item: TieredChallengeException): TieredChallengeExceptionView {
  return new TieredChallengeExceptionView(
    item.code,
    text.truncate(item.title, 64),
    item.campaignRef,
    String(item.updatedAt),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredChallengeExceptionViews(items: TieredChallengeException[]): TieredChallengeExceptionView[] {
  const views: TieredChallengeExceptionView[] = [];
  for (const item of items) {
    views.push(toTieredChallengeExceptionView(item));
  }
  return views;
}

export function sumTieredChallengeExceptionView(view: TieredChallengeExceptionView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedUpdatedAt;
}
