import { CappedWaitDigest } from "./capped-wait-digest.js";

/** How screens and exports show a capped wait digest. */
export class CappedWaitDigestView {
  code: string;
  titleText: string;
  variantText: string;
  contactEmail: string;
  limit: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    variantText: string,
    contactEmail: string,
    limit: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.variantText = variantText;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toCappedWaitDigestView(item: CappedWaitDigest): CappedWaitDigestView {
  return new CappedWaitDigestView(
    item.code,
    item.title,
    item.variant,
    item.contactEmail,
    String(item.limit),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedWaitDigestViews(items: CappedWaitDigest[]): CappedWaitDigestView[] {
  const views: CappedWaitDigestView[] = [];
  for (const item of items) {
    views.push(toCappedWaitDigestView(item));
  }
  return views;
}

export function sumCappedWaitDigestView(view: CappedWaitDigestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedLimit + parsedAttempts;
}
