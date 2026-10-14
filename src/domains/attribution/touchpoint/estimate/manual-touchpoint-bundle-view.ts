import * as text from "../../../../kit/text.js";
import { ManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

/** How screens and exports show a manual touchpoint bundle. */
export class ManualTouchpointBundleView {
  codeText: string;
  label: string;
  visible: string;
  campaignRefText: string;
  sendAt: string;
  budget: string;
  weight: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    visible: string,
    campaignRefText: string,
    sendAt: string,
    budget: string,
    weight: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.visible = visible;
    this.campaignRefText = campaignRefText;
    this.sendAt = sendAt;
    this.budget = budget;
    this.weight = weight;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toManualTouchpointBundleView(item: ManualTouchpointBundle): ManualTouchpointBundleView {
  return new ManualTouchpointBundleView(
    text.truncate(item.code, 40),
    item.label,
    `${item.visible}`,
    text.truncate(item.campaignRef, 80),
    String(item.sendAt),
    item.budget.toFixed(2),
    item.weight.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualTouchpointBundleViews(items: ManualTouchpointBundle[]): ManualTouchpointBundleView[] {
  const views: ManualTouchpointBundleView[] = [];
  for (const item of items) {
    views.push(toManualTouchpointBundleView(item));
  }
  return views;
}

export function sumManualTouchpointBundleView(view: ManualTouchpointBundleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedSendAt + parsedBudget + parsedWeight;
}
