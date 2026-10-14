import * as text from "../../../../kit/text.js";
import { DeflectionProfile } from "./deflection-profile.js";

/** How screens and exports show a deflection profile. */
export class DeflectionProfileView {
  codeText: string;
  name: string;
  score: string;
  openRate: string;
  approved: string;
  notesText: string;
  limitText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    score: string,
    openRate: string,
    approved: string,
    notesText: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.score = score;
    this.openRate = openRate;
    this.approved = approved;
    this.notesText = notesText;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionProfileView(item: DeflectionProfile): DeflectionProfileView {
  return new DeflectionProfileView(
    item.code,
    item.name,
    item.score.toFixed(2),
    item.openRate.toFixed(2),
    `${item.approved}`,
    text.truncate(item.notes, 120),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionProfileViews(items: DeflectionProfile[]): DeflectionProfileView[] {
  const views: DeflectionProfileView[] = [];
  for (const item of items) {
    views.push(toDeflectionProfileView(item));
  }
  return views;
}

export function sumDeflectionProfileView(view: DeflectionProfileView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedScore + parsedOpenRate + parsedLimit;
}
