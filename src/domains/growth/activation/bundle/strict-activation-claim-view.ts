import * as text from "../../../../kit/text.js";
import { StrictActivationClaim } from "./strict-activation-claim.js";

/** How screens and exports show a strict activation claim. */
export class StrictActivationClaimView {
  code: string;
  title: string;
  channel: string;
  approved: string;
  openRate: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channel: string,
    approved: string,
    openRate: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.approved = approved;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toStrictActivationClaimView(item: StrictActivationClaim): StrictActivationClaimView {
  return new StrictActivationClaimView(
    item.code,
    text.truncate(item.title, 64),
    item.channel,
    `${item.approved}`,
    item.openRate.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictActivationClaimViews(items: StrictActivationClaim[]): StrictActivationClaimView[] {
  const views: StrictActivationClaimView[] = [];
  for (const item of items) {
    views.push(toStrictActivationClaimView(item));
  }
  return views;
}

export function sumStrictActivationClaimView(view: StrictActivationClaimView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedOpenRate + parsedCeiling;
}
