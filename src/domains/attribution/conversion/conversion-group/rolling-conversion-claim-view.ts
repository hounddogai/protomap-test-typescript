import * as text from "../../../../kit/text.js";
import { RollingConversionClaim } from "./rolling-conversion-claim.js";

/** How screens and exports show a rolling conversion claim. */
export class RollingConversionClaimView {
  codeText: string;
  labelText: string;
  title: string;
  priority: string;
  createdAt: string;
  contactEmail: string;
  pinned: string;
  name: string;
  phoneText: string;
  rateText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    title: string,
    priority: string,
    createdAt: string,
    contactEmail: string,
    pinned: string,
    name: string,
    phoneText: string,
    rateText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.title = title;
    this.priority = priority;
    this.createdAt = createdAt;
    this.contactEmail = contactEmail;
    this.pinned = pinned;
    this.name = name;
    this.phoneText = phoneText;
    this.rateText = rateText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingConversionClaimView(item: RollingConversionClaim): RollingConversionClaimView {
  return new RollingConversionClaimView(
    item.code,
    item.label,
    item.title,
    String(item.priority),
    String(item.createdAt),
    text.truncate(item.contactEmail, 40),
    `${item.pinned}`,
    item.name,
    text.truncate(item.phone, 80),
    item.rate.toFixed(2),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingConversionClaimViews(items: RollingConversionClaim[]): RollingConversionClaimView[] {
  const views: RollingConversionClaimView[] = [];
  for (const item of items) {
    views.push(toRollingConversionClaimView(item));
  }
  return views;
}

export function sumRollingConversionClaimView(view: RollingConversionClaimView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedPriority + parsedCreatedAt + parsedRate;
}
