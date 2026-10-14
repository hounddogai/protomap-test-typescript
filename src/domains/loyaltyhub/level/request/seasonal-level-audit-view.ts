import * as text from "../../../../kit/text.js";
import { SeasonalLevelAudit } from "./seasonal-level-audit.js";

/** How screens and exports show a seasonal level audit. */
export class SeasonalLevelAuditView {
  code: string;
  name: string;
  archived: string;
  externalRef: string;
  journeyId: string;
  score: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    archived: string,
    externalRef: string,
    journeyId: string,
    score: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalLevelAuditView(item: SeasonalLevelAudit): SeasonalLevelAuditView {
  return new SeasonalLevelAuditView(
    text.truncate(item.code, 120),
    item.name,
    `${item.archived}`,
    item.externalRef,
    item.journeyId,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalLevelAuditViews(items: SeasonalLevelAudit[]): SeasonalLevelAuditView[] {
  const views: SeasonalLevelAuditView[] = [];
  for (const item of items) {
    views.push(toSeasonalLevelAuditView(item));
  }
  return views;
}

export function sumSeasonalLevelAuditView(view: SeasonalLevelAuditView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedScore;
}
