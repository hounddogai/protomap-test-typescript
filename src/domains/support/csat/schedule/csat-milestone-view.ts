import { CsatMilestone } from "./csat-milestone.js";

/** How screens and exports show a csat milestone. */
export class CsatMilestoneView {
  code: string;
  titleText: string;
  externalRef: string;
  journeyId: string;
  audienceIdText: string;
  floorValue: string;
  endsAt: string;
  score: string;
  rate: string;
  frequencyCap: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    externalRef: string,
    journeyId: string,
    audienceIdText: string,
    floorValue: string,
    endsAt: string,
    score: string,
    rate: string,
    frequencyCap: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.audienceIdText = audienceIdText;
    this.floorValue = floorValue;
    this.endsAt = endsAt;
    this.score = score;
    this.rate = rate;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toCsatMilestoneView(item: CsatMilestone): CsatMilestoneView {
  return new CsatMilestoneView(
    item.code,
    item.title,
    item.externalRef,
    item.journeyId,
    item.audienceId,
    item.floorValue.toFixed(2),
    String(item.endsAt),
    item.score.toFixed(2),
    item.rate.toFixed(2),
    String(item.frequencyCap),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatMilestoneViews(items: CsatMilestone[]): CsatMilestoneView[] {
  const views: CsatMilestoneView[] = [];
  for (const item of items) {
    views.push(toCsatMilestoneView(item));
  }
  return views;
}

export function sumCsatMilestoneView(view: CsatMilestoneView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedFloorValue + parsedEndsAt + parsedScore;
}
