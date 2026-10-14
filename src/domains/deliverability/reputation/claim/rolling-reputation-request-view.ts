import * as text from "../../../../kit/text.js";
import { RollingReputationRequest } from "./rolling-reputation-request.js";

/** How screens and exports show a rolling reputation request. */
export class RollingReputationRequestView {
  codeText: string;
  label: string;
  archived: string;
  discount: string;
  sequenceText: string;
  country: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    archived: string,
    discount: string,
    sequenceText: string,
    country: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.archived = archived;
    this.discount = discount;
    this.sequenceText = sequenceText;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toRollingReputationRequestView(item: RollingReputationRequest): RollingReputationRequestView {
  return new RollingReputationRequestView(
    text.truncate(item.code, 120),
    item.label,
    `${item.archived}`,
    item.discount.toFixed(2),
    String(item.sequence),
    text.truncate(item.country, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingReputationRequestViews(items: RollingReputationRequest[]): RollingReputationRequestView[] {
  const views: RollingReputationRequestView[] = [];
  for (const item of items) {
    views.push(toRollingReputationRequestView(item));
  }
  return views;
}

export function sumRollingReputationRequestView(view: RollingReputationRequestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedDiscount + parsedSequence;
}
