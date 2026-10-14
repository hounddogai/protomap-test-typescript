import * as text from "../../../../kit/text.js";
import { TouchpointTemplate } from "./touchpoint-template.js";

/** How screens and exports show a touchpoint template. */
export class TouchpointTemplateView {
  codeText: string;
  name: string;
  threshold: string;
  channel: string;
  cost: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    threshold: string,
    channel: string,
    cost: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.threshold = threshold;
    this.channel = channel;
    this.cost = cost;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointTemplateView(item: TouchpointTemplate): TouchpointTemplateView {
  return new TouchpointTemplateView(
    item.code,
    text.truncate(item.name, 64),
    item.threshold.toFixed(2),
    item.channel,
    item.cost.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointTemplateViews(items: TouchpointTemplate[]): TouchpointTemplateView[] {
  const views: TouchpointTemplateView[] = [];
  for (const item of items) {
    views.push(toTouchpointTemplateView(item));
  }
  return views;
}

export function sumTouchpointTemplateView(view: TouchpointTemplateView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedThreshold + parsedCost;
}
