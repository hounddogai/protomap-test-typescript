import * as text from "../../../../kit/text.js";
import { CappedNudgeMapping } from "./capped-nudge-mapping.js";

/** How screens and exports show a capped nudge mapping. */
export class CappedNudgeMappingView {
  code: string;
  label: string;
  audienceId: string;
  endsAt: string;
  budget: string;
  openRate: string;
  channel: string;
  notes: string;
  priority: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    endsAt: string,
    budget: string,
    openRate: string,
    channel: string,
    notes: string,
    priority: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.budget = budget;
    this.openRate = openRate;
    this.channel = channel;
    this.notes = notes;
    this.priority = priority;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toCappedNudgeMappingView(item: CappedNudgeMapping): CappedNudgeMappingView {
  return new CappedNudgeMappingView(
    item.code,
    item.label,
    text.truncate(item.audienceId, 120),
    String(item.endsAt),
    item.budget.toFixed(2),
    item.openRate.toFixed(2),
    item.channel,
    text.truncate(item.notes, 120),
    String(item.priority),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedNudgeMappingViews(items: CappedNudgeMapping[]): CappedNudgeMappingView[] {
  const views: CappedNudgeMappingView[] = [];
  for (const item of items) {
    views.push(toCappedNudgeMappingView(item));
  }
  return views;
}

export function sumCappedNudgeMappingView(view: CappedNudgeMappingView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedEndsAt + parsedBudget + parsedOpenRate;
}
