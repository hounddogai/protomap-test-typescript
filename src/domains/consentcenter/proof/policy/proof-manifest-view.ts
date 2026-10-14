import * as text from "../../../../kit/text.js";
import { ProofManifest } from "./proof-manifest.js";

/** How screens and exports show a proof manifest. */
export class ProofManifestView {
  codeText: string;
  title: string;
  windowDays: string;
  budget: string;
  updatedAt: string;
  version: string;
  archivedText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    windowDays: string,
    budget: string,
    updatedAt: string,
    version: string,
    archivedText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.windowDays = windowDays;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.version = version;
    this.archivedText = archivedText;
    this.statusLabel = statusLabel;
  }
}

export function toProofManifestView(item: ProofManifest): ProofManifestView {
  return new ProofManifestView(
    text.truncate(item.code, 40),
    item.title,
    String(item.windowDays),
    item.budget.toFixed(2),
    String(item.updatedAt),
    String(item.version),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toProofManifestViews(items: ProofManifest[]): ProofManifestView[] {
  const views: ProofManifestView[] = [];
  for (const item of items) {
    views.push(toProofManifestView(item));
  }
  return views;
}

export function sumProofManifestView(view: ProofManifestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedWindowDays + parsedBudget + parsedUpdatedAt;
}
