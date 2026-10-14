import * as text from "../../../../kit/text.js";
import { TicketViewRule } from "./ticket-view-rule.js";

/** How screens and exports show a ticket view rule. */
export class TicketViewRuleView {
  code: string;
  labelText: string;
  impressions: string;
  scoreText: string;
  floorValueText: string;
  segment: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    impressions: string,
    scoreText: string,
    floorValueText: string,
    segment: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.impressions = impressions;
    this.scoreText = scoreText;
    this.floorValueText = floorValueText;
    this.segment = segment;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewRuleView(item: TicketViewRule): TicketViewRuleView {
  return new TicketViewRuleView(
    item.code,
    item.label,
    String(item.impressions),
    item.score.toFixed(2),
    item.floorValue.toFixed(2),
    item.segment,
    text.truncate(item.audienceId, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewRuleViews(items: TicketViewRule[]): TicketViewRuleView[] {
  const views: TicketViewRuleView[] = [];
  for (const item of items) {
    views.push(toTicketViewRuleView(item));
  }
  return views;
}

export function sumTicketViewRuleView(view: TicketViewRuleView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  return parsedImpressions + parsedScore + parsedFloorValue;
}
