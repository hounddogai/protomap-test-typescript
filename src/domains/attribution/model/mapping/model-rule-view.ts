import * as text from "../../../../kit/text.js";
import { ModelRule } from "./model-rule.js";

/** How screens and exports show a model rule. */
export class ModelRuleView {
  code: string;
  name: string;
  floorValue: string;
  scoreText: string;
  audienceId: string;
  journeyIdText: string;
  openRate: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    scoreText: string,
    audienceId: string,
    journeyIdText: string,
    openRate: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.scoreText = scoreText;
    this.audienceId = audienceId;
    this.journeyIdText = journeyIdText;
    this.openRate = openRate;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toModelRuleView(item: ModelRule): ModelRuleView {
  return new ModelRuleView(
    item.code,
    text.truncate(item.name, 80),
    item.floorValue.toFixed(2),
    item.score.toFixed(2),
    text.truncate(item.audienceId, 120),
    item.journeyId,
    item.openRate.toFixed(2),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toModelRuleViews(items: ModelRule[]): ModelRuleView[] {
  const views: ModelRuleView[] = [];
  for (const item of items) {
    views.push(toModelRuleView(item));
  }
  return views;
}

export function sumModelRuleView(view: ModelRuleView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedFloorValue + parsedScore + parsedOpenRate;
}
