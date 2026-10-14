import * as text from "../../../../kit/text.js";
import { BatchedFunnelPreference } from "./batched-funnel-preference.js";

/** How screens and exports show a batched funnel preference. */
export class BatchedFunnelPreferenceView {
  codeText: string;
  title: string;
  regionText: string;
  visible: string;
  attempts: string;
  startsAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    regionText: string,
    visible: string,
    attempts: string,
    startsAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.regionText = regionText;
    this.visible = visible;
    this.attempts = attempts;
    this.startsAtText = startsAtText;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedFunnelPreferenceView(item: BatchedFunnelPreference): BatchedFunnelPreferenceView {
  return new BatchedFunnelPreferenceView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    item.region,
    `${item.visible}`,
    String(item.attempts),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedFunnelPreferenceViews(items: BatchedFunnelPreference[]): BatchedFunnelPreferenceView[] {
  const views: BatchedFunnelPreferenceView[] = [];
  for (const item of items) {
    views.push(toBatchedFunnelPreferenceView(item));
  }
  return views;
}

export function sumBatchedFunnelPreferenceView(view: BatchedFunnelPreferenceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  return parsedAttempts + parsedStartsAt;
}
