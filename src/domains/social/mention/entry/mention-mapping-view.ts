import * as text from "../../../../kit/text.js";
import { MentionMapping } from "./mention-mapping.js";

/** How screens and exports show a mention mapping. */
export class MentionMappingView {
  code: string;
  name: string;
  utmSource: string;
  phoneText: string;
  variantText: string;
  expiresAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    phoneText: string,
    variantText: string,
    expiresAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.phoneText = phoneText;
    this.variantText = variantText;
    this.expiresAtText = expiresAtText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionMappingView(item: MentionMapping): MentionMappingView {
  return new MentionMappingView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.utmSource, 40),
    item.phone,
    text.truncate(item.variant, 120),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionMappingViews(items: MentionMapping[]): MentionMappingView[] {
  const views: MentionMappingView[] = [];
  for (const item of items) {
    views.push(toMentionMappingView(item));
  }
  return views;
}

export function sumMentionMappingView(view: MentionMappingView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedExpiresAt;
}
