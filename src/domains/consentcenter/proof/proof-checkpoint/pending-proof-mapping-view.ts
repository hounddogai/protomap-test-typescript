import * as text from "../../../../kit/text.js";
import { PendingProofMapping } from "./pending-proof-mapping.js";

/** How screens and exports show a pending proof mapping. */
export class PendingProofMappingView {
  codeText: string;
  labelText: string;
  visibleText: string;
  createdAt: string;
  score: string;
  country: string;
  expiresAt: string;
  externalRefText: string;
  journeyId: string;
  summary: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    visibleText: string,
    createdAt: string,
    score: string,
    country: string,
    expiresAt: string,
    externalRefText: string,
    journeyId: string,
    summary: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.visibleText = visibleText;
    this.createdAt = createdAt;
    this.score = score;
    this.country = country;
    this.expiresAt = expiresAt;
    this.externalRefText = externalRefText;
    this.journeyId = journeyId;
    this.summary = summary;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingProofMappingView(item: PendingProofMapping): PendingProofMappingView {
  return new PendingProofMappingView(
    item.code,
    text.truncate(item.label, 64),
    `${item.visible}`,
    String(item.createdAt),
    item.score.toFixed(2),
    item.country,
    String(item.expiresAt),
    text.truncate(item.externalRef, 64),
    text.truncate(item.journeyId, 120),
    item.summary,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingProofMappingViews(items: PendingProofMapping[]): PendingProofMappingView[] {
  const views: PendingProofMappingView[] = [];
  for (const item of items) {
    views.push(toPendingProofMappingView(item));
  }
  return views;
}

export function sumPendingProofMappingView(view: PendingProofMappingView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedCreatedAt + parsedScore + parsedExpiresAt;
}
