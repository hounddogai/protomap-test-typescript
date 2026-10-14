import * as text from "../../../../kit/text.js";
import { SeasonalCohortProposal } from "./seasonal-cohort-proposal.js";

/** How screens and exports show a seasonal cohort proposal. */
export class SeasonalCohortProposalView {
  code: string;
  name: string;
  updatedAt: string;
  ratioText: string;
  margin: string;
  frequencyCapText: string;
  durationMinutes: string;
  retries: string;
  notes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    updatedAt: string,
    ratioText: string,
    margin: string,
    frequencyCapText: string,
    durationMinutes: string,
    retries: string,
    notes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ratioText = ratioText;
    this.margin = margin;
    this.frequencyCapText = frequencyCapText;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.notes = notes;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCohortProposalView(item: SeasonalCohortProposal): SeasonalCohortProposalView {
  return new SeasonalCohortProposalView(
    text.truncate(item.code, 80),
    item.name,
    String(item.updatedAt),
    item.ratio.toFixed(2),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    String(item.durationMinutes),
    String(item.retries),
    item.notes,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCohortProposalViews(items: SeasonalCohortProposal[]): SeasonalCohortProposalView[] {
  const views: SeasonalCohortProposalView[] = [];
  for (const item of items) {
    views.push(toSeasonalCohortProposalView(item));
  }
  return views;
}

export function sumSeasonalCohortProposalView(view: SeasonalCohortProposalView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedUpdatedAt + parsedRatio + parsedMargin;
}
