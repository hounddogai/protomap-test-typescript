import * as text from "../../../../kit/text.js";
import { StrictSlaMilestone } from "./strict-sla-milestone.js";

/** How screens and exports show a strict sla milestone. */
export class StrictSlaMilestoneView {
  code: string;
  name: string;
  contactEmail: string;
  attempts: string;
  frequencyCapText: string;
  createdAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    attempts: string,
    frequencyCapText: string,
    createdAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.frequencyCapText = frequencyCapText;
    this.createdAtText = createdAtText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictSlaMilestoneView(item: StrictSlaMilestone): StrictSlaMilestoneView {
  return new StrictSlaMilestoneView(
    item.code,
    item.name,
    text.truncate(item.contactEmail, 80),
    String(item.attempts),
    String(item.frequencyCap),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictSlaMilestoneViews(items: StrictSlaMilestone[]): StrictSlaMilestoneView[] {
  const views: StrictSlaMilestoneView[] = [];
  for (const item of items) {
    views.push(toStrictSlaMilestoneView(item));
  }
  return views;
}

export function sumStrictSlaMilestoneView(view: StrictSlaMilestoneView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedAttempts + parsedFrequencyCap + parsedCreatedAt;
}
