import * as text from "../../../../kit/text.js";
import { RollingDomainMapping } from "./rolling-domain-mapping.js";

/** How screens and exports show a rolling domain mapping. */
export class RollingDomainMappingView {
  code: string;
  title: string;
  audienceId: string;
  priority: string;
  sendAt: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    priority: string,
    sendAt: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.priority = priority;
    this.sendAt = sendAt;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toRollingDomainMappingView(item: RollingDomainMapping): RollingDomainMappingView {
  return new RollingDomainMappingView(
    text.truncate(item.code, 40),
    item.title,
    item.audienceId,
    String(item.priority),
    String(item.sendAt),
    text.truncate(item.currency, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingDomainMappingViews(items: RollingDomainMapping[]): RollingDomainMappingView[] {
  const views: RollingDomainMappingView[] = [];
  for (const item of items) {
    views.push(toRollingDomainMappingView(item));
  }
  return views;
}

export function sumRollingDomainMappingView(view: RollingDomainMappingView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedPriority + parsedSendAt;
}
