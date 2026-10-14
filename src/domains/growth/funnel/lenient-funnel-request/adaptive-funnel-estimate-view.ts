import { AdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

/** How screens and exports show a adaptive funnel estimate. */
export class AdaptiveFunnelEstimateView {
  code: string;
  title: string;
  visible: string;
  approvedText: string;
  endsAt: string;
  floorValue: string;
  campaignRef: string;
  name: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    visible: string,
    approvedText: string,
    endsAt: string,
    floorValue: string,
    campaignRef: string,
    name: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.approvedText = approvedText;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.name = name;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFunnelEstimateView(item: AdaptiveFunnelEstimate): AdaptiveFunnelEstimateView {
  return new AdaptiveFunnelEstimateView(
    item.code,
    item.title,
    `${item.visible}`,
    `${item.approved}`,
    String(item.endsAt),
    item.floorValue.toFixed(2),
    item.campaignRef,
    item.name,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFunnelEstimateViews(items: AdaptiveFunnelEstimate[]): AdaptiveFunnelEstimateView[] {
  const views: AdaptiveFunnelEstimateView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFunnelEstimateView(item));
  }
  return views;
}

export function sumAdaptiveFunnelEstimateView(view: AdaptiveFunnelEstimateView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedEndsAt + parsedFloorValue + parsedPriority;
}
