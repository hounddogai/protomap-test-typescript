import * as text from "../../../../kit/text.js";
import { RollingNudgeProposal } from "./rolling-nudge-proposal.js";

/** How screens and exports show a rolling nudge proposal. */
export class RollingNudgeProposalView {
  code: string;
  title: string;
  weight: string;
  floorValue: string;
  priority: string;
  clicks: string;
  graceDaysText: string;
  utmSource: string;
  impressions: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    weight: string,
    floorValue: string,
    priority: string,
    clicks: string,
    graceDaysText: string,
    utmSource: string,
    impressions: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.floorValue = floorValue;
    this.priority = priority;
    this.clicks = clicks;
    this.graceDaysText = graceDaysText;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeProposalView(item: RollingNudgeProposal): RollingNudgeProposalView {
  return new RollingNudgeProposalView(
    item.code,
    item.title,
    item.weight.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.priority),
    String(item.clicks),
    String(item.graceDays),
    text.truncate(item.utmSource, 40),
    String(item.impressions),
    text.truncate(item.journeyId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeProposalViews(items: RollingNudgeProposal[]): RollingNudgeProposalView[] {
  const views: RollingNudgeProposalView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeProposalView(item));
  }
  return views;
}

export function sumRollingNudgeProposalView(view: RollingNudgeProposalView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedWeight + parsedFloorValue + parsedPriority;
}
