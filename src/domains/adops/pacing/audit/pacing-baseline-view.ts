import * as text from "../../../../kit/text.js";
import { PacingBaseline } from "./pacing-baseline.js";

/** How screens and exports show a pacing baseline. */
export class PacingBaselineView {
  code: string;
  title: string;
  notesText: string;
  description: string;
  version: string;
  attemptsText: string;
  createdAt: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notesText: string,
    description: string,
    version: string,
    attemptsText: string,
    createdAt: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notesText = notesText;
    this.description = description;
    this.version = version;
    this.attemptsText = attemptsText;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toPacingBaselineView(item: PacingBaseline): PacingBaselineView {
  return new PacingBaselineView(
    text.truncate(item.code, 64),
    item.title,
    item.notes,
    item.description,
    String(item.version),
    String(item.attempts),
    String(item.createdAt),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingBaselineViews(items: PacingBaseline[]): PacingBaselineView[] {
  const views: PacingBaselineView[] = [];
  for (const item of items) {
    views.push(toPacingBaselineView(item));
  }
  return views;
}

export function sumPacingBaselineView(view: PacingBaselineView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedVersion + parsedAttempts + parsedCreatedAt;
}
