import * as text from "../../../../kit/text.js";
import { WeightedWindowProposal } from "./weighted-window-proposal.js";

/** How screens and exports show a weighted window proposal. */
export class WeightedWindowProposalView {
  code: string;
  title: string;
  timezone: string;
  cohort: string;
  attempts: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    timezone: string,
    cohort: string,
    attempts: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.cohort = cohort;
    this.attempts = attempts;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedWindowProposalView(item: WeightedWindowProposal): WeightedWindowProposalView {
  return new WeightedWindowProposalView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    item.timezone,
    text.truncate(item.cohort, 40),
    String(item.attempts),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedWindowProposalViews(items: WeightedWindowProposal[]): WeightedWindowProposalView[] {
  const views: WeightedWindowProposalView[] = [];
  for (const item of items) {
    views.push(toWeightedWindowProposalView(item));
  }
  return views;
}

export function sumWeightedWindowProposalView(view: WeightedWindowProposalView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedAttempts + parsedVersion;
}
