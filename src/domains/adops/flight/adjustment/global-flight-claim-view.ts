import { GlobalFlightClaim } from "./global-flight-claim.js";

/** How screens and exports show a global flight claim. */
export class GlobalFlightClaimView {
  codeText: string;
  nameText: string;
  windowDays: string;
  contactEmail: string;
  score: string;
  priorityText: string;
  discount: string;
  version: string;
  sequence: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    windowDays: string,
    contactEmail: string,
    score: string,
    priorityText: string,
    discount: string,
    version: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.score = score;
    this.priorityText = priorityText;
    this.discount = discount;
    this.version = version;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalFlightClaimView(item: GlobalFlightClaim): GlobalFlightClaimView {
  return new GlobalFlightClaimView(
    item.code,
    item.name,
    String(item.windowDays),
    item.contactEmail,
    item.score.toFixed(2),
    String(item.priority),
    item.discount.toFixed(2),
    String(item.version),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalFlightClaimViews(items: GlobalFlightClaim[]): GlobalFlightClaimView[] {
  const views: GlobalFlightClaimView[] = [];
  for (const item of items) {
    views.push(toGlobalFlightClaimView(item));
  }
  return views;
}

export function sumGlobalFlightClaimView(view: GlobalFlightClaimView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedWindowDays + parsedScore + parsedPriority;
}
