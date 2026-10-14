import { ReplyMapping } from "./reply-mapping.js";

/** How screens and exports show a reply mapping. */
export class ReplyMappingView {
  code: string;
  label: string;
  sendAt: string;
  externalRefText: string;
  ownerId: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    externalRefText: string,
    ownerId: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.externalRefText = externalRefText;
    this.ownerId = ownerId;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toReplyMappingView(item: ReplyMapping): ReplyMappingView {
  return new ReplyMappingView(
    item.code,
    item.label,
    String(item.sendAt),
    item.externalRef,
    item.ownerId,
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyMappingViews(items: ReplyMapping[]): ReplyMappingView[] {
  const views: ReplyMappingView[] = [];
  for (const item of items) {
    views.push(toReplyMappingView(item));
  }
  return views;
}

export function sumReplyMappingView(view: ReplyMappingView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedSendAt + parsedOpenRate;
}
