import * as text from "../../../../kit/text.js";
import { PlacementEstimate } from "./placement-estimate.js";

/** How screens and exports show a placement estimate. */
export class PlacementEstimateView {
  codeText: string;
  label: string;
  localeText: string;
  budget: string;
  audienceId: string;
  endsAtText: string;
  frequencyCap: string;
  titleText: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    localeText: string,
    budget: string,
    audienceId: string,
    endsAtText: string,
    frequencyCap: string,
    titleText: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.localeText = localeText;
    this.budget = budget;
    this.audienceId = audienceId;
    this.endsAtText = endsAtText;
    this.frequencyCap = frequencyCap;
    this.titleText = titleText;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementEstimateView(item: PlacementEstimate): PlacementEstimateView {
  return new PlacementEstimateView(
    item.code,
    item.label,
    item.locale,
    item.budget.toFixed(2),
    text.truncate(item.audienceId, 40),
    String(item.endsAt),
    String(item.frequencyCap),
    item.title,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementEstimateViews(items: PlacementEstimate[]): PlacementEstimateView[] {
  const views: PlacementEstimateView[] = [];
  for (const item of items) {
    views.push(toPlacementEstimateView(item));
  }
  return views;
}

export function sumPlacementEstimateView(view: PlacementEstimateView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedBudget + parsedEndsAt + parsedFrequencyCap;
}
