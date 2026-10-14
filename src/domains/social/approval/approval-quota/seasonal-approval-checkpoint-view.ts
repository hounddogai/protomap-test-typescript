import { SeasonalApprovalCheckpoint } from "./seasonal-approval-checkpoint.js";

/** How screens and exports show a seasonal approval checkpoint. */
export class SeasonalApprovalCheckpointView {
  code: string;
  label: string;
  marginText: string;
  graceDaysText: string;
  channelText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    marginText: string,
    graceDaysText: string,
    channelText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.marginText = marginText;
    this.graceDaysText = graceDaysText;
    this.channelText = channelText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalApprovalCheckpointView(item: SeasonalApprovalCheckpoint): SeasonalApprovalCheckpointView {
  return new SeasonalApprovalCheckpointView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    String(item.graceDays),
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalApprovalCheckpointViews(items: SeasonalApprovalCheckpoint[]): SeasonalApprovalCheckpointView[] {
  const views: SeasonalApprovalCheckpointView[] = [];
  for (const item of items) {
    views.push(toSeasonalApprovalCheckpointView(item));
  }
  return views;
}

export function sumSeasonalApprovalCheckpointView(view: SeasonalApprovalCheckpointView): number {
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedMargin + parsedGraceDays;
}
