import * as text from "../../../../kit/text.js";
import { LenientSlaProfile } from "./lenient-sla-profile.js";

/** How screens and exports show a lenient sla profile. */
export class LenientSlaProfileView {
  code: string;
  name: string;
  bid: string;
  attempts: string;
  createdAt: string;
  revision: string;
  sourceText: string;
  minimumText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bid: string,
    attempts: string,
    createdAt: string,
    revision: string,
    sourceText: string,
    minimumText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.attempts = attempts;
    this.createdAt = createdAt;
    this.revision = revision;
    this.sourceText = sourceText;
    this.minimumText = minimumText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLenientSlaProfileView(item: LenientSlaProfile): LenientSlaProfileView {
  return new LenientSlaProfileView(
    item.code,
    text.truncate(item.name, 40),
    item.bid.toFixed(2),
    String(item.attempts),
    String(item.createdAt),
    String(item.revision),
    item.source,
    item.minimum.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientSlaProfileViews(items: LenientSlaProfile[]): LenientSlaProfileView[] {
  const views: LenientSlaProfileView[] = [];
  for (const item of items) {
    views.push(toLenientSlaProfileView(item));
  }
  return views;
}

export function sumLenientSlaProfileView(view: LenientSlaProfileView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedBid + parsedAttempts + parsedCreatedAt;
}
