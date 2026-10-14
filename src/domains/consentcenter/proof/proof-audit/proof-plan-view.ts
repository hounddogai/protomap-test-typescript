import { ProofPlan } from "./proof-plan.js";

/** How screens and exports show a proof plan. */
export class ProofPlanView {
  codeText: string;
  title: string;
  floorValueText: string;
  channel: string;
  clicks: string;
  endsAt: string;
  version: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    floorValueText: string,
    channel: string,
    clicks: string,
    endsAt: string,
    version: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.floorValueText = floorValueText;
    this.channel = channel;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toProofPlanView(item: ProofPlan): ProofPlanView {
  return new ProofPlanView(
    item.code,
    item.title,
    item.floorValue.toFixed(2),
    item.channel,
    String(item.clicks),
    String(item.endsAt),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toProofPlanViews(items: ProofPlan[]): ProofPlanView[] {
  const views: ProofPlanView[] = [];
  for (const item of items) {
    views.push(toProofPlanView(item));
  }
  return views;
}

export function sumProofPlanView(view: ProofPlanView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedFloorValue + parsedClicks + parsedEndsAt;
}
