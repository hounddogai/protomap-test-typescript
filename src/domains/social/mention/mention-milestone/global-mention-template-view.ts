import { GlobalMentionTemplate } from "./global-mention-template.js";

/** How screens and exports show a global mention template. */
export class GlobalMentionTemplateView {
  code: string;
  label: string;
  openRate: string;
  sendAtText: string;
  floorValue: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    openRate: string,
    sendAtText: string,
    floorValue: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.sendAtText = sendAtText;
    this.floorValue = floorValue;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalMentionTemplateView(item: GlobalMentionTemplate): GlobalMentionTemplateView {
  return new GlobalMentionTemplateView(
    item.code,
    item.label,
    item.openRate.toFixed(2),
    String(item.sendAt),
    item.floorValue.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalMentionTemplateViews(items: GlobalMentionTemplate[]): GlobalMentionTemplateView[] {
  const views: GlobalMentionTemplateView[] = [];
  for (const item of items) {
    views.push(toGlobalMentionTemplateView(item));
  }
  return views;
}

export function sumGlobalMentionTemplateView(view: GlobalMentionTemplateView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedOpenRate + parsedSendAt + parsedFloorValue;
}
