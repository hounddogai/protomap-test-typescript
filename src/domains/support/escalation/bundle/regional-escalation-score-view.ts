import { RegionalEscalationScore } from "./regional-escalation-score.js";

/** How screens and exports show a regional escalation score. */
export class RegionalEscalationScoreView {
  code: string;
  title: string;
  createdAt: string;
  journeyId: string;
  localeText: string;
  ceiling: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    createdAt: string,
    journeyId: string,
    localeText: string,
    ceiling: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.localeText = localeText;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalEscalationScoreView(item: RegionalEscalationScore): RegionalEscalationScoreView {
  return new RegionalEscalationScoreView(
    item.code,
    item.title,
    String(item.createdAt),
    item.journeyId,
    item.locale,
    item.ceiling.toFixed(2),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalEscalationScoreViews(items: RegionalEscalationScore[]): RegionalEscalationScoreView[] {
  const views: RegionalEscalationScoreView[] = [];
  for (const item of items) {
    views.push(toRegionalEscalationScoreView(item));
  }
  return views;
}

export function sumRegionalEscalationScoreView(view: RegionalEscalationScoreView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCreatedAt + parsedCeiling;
}
