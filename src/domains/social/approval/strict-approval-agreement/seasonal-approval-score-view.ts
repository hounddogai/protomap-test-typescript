import { SeasonalApprovalScore } from "./seasonal-approval-score.js";

/** How screens and exports show a seasonal approval score. */
export class SeasonalApprovalScoreView {
  code: string;
  name: string;
  capacity: string;
  description: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacity: string,
    description: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.description = description;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalApprovalScoreView(item: SeasonalApprovalScore): SeasonalApprovalScoreView {
  return new SeasonalApprovalScoreView(
    item.code,
    item.name,
    String(item.capacity),
    item.description,
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalApprovalScoreViews(items: SeasonalApprovalScore[]): SeasonalApprovalScoreView[] {
  const views: SeasonalApprovalScoreView[] = [];
  for (const item of items) {
    views.push(toSeasonalApprovalScoreView(item));
  }
  return views;
}

export function sumSeasonalApprovalScoreView(view: SeasonalApprovalScoreView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCapacity + parsedStartsAt;
}
