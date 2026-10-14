import * as text from "../../../../kit/text.js";
import { DefaultPlacementDigest } from "./default-placement-digest.js";

/** How screens and exports show a default placement digest. */
export class DefaultPlacementDigestView {
  code: string;
  name: string;
  contactEmail: string;
  descriptionText: string;
  variant: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    descriptionText: string,
    variant: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.descriptionText = descriptionText;
    this.variant = variant;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultPlacementDigestView(item: DefaultPlacementDigest): DefaultPlacementDigestView {
  return new DefaultPlacementDigestView(
    item.code,
    text.truncate(item.name, 120),
    item.contactEmail,
    item.description,
    text.truncate(item.variant, 40),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultPlacementDigestViews(items: DefaultPlacementDigest[]): DefaultPlacementDigestView[] {
  const views: DefaultPlacementDigestView[] = [];
  for (const item of items) {
    views.push(toDefaultPlacementDigestView(item));
  }
  return views;
}

export function sumDefaultPlacementDigestView(view: DefaultPlacementDigestView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
