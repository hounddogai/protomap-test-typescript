import * as text from "../../../../kit/text.js";
import { CreativeQuota } from "./creative-quota.js";

/** How screens and exports show a creative quota. */
export class CreativeQuotaView {
  codeText: string;
  name: string;
  conversionRateText: string;
  attemptsText: string;
  phone: string;
  createdAt: string;
  amount: string;
  channel: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    conversionRateText: string,
    attemptsText: string,
    phone: string,
    createdAt: string,
    amount: string,
    channel: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.conversionRateText = conversionRateText;
    this.attemptsText = attemptsText;
    this.phone = phone;
    this.createdAt = createdAt;
    this.amount = amount;
    this.channel = channel;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeQuotaView(item: CreativeQuota): CreativeQuotaView {
  return new CreativeQuotaView(
    text.truncate(item.code, 80),
    item.name,
    item.conversionRate.toFixed(2),
    String(item.attempts),
    item.phone,
    String(item.createdAt),
    item.amount.toFixed(2),
    item.channel,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeQuotaViews(items: CreativeQuota[]): CreativeQuotaView[] {
  const views: CreativeQuotaView[] = [];
  for (const item of items) {
    views.push(toCreativeQuotaView(item));
  }
  return views;
}

export function sumCreativeQuotaView(view: CreativeQuotaView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedConversionRate + parsedAttempts + parsedCreatedAt;
}
