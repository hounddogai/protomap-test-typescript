import { EscalationManifest } from "./escalation-manifest.js";

/** How screens and exports show a escalation manifest. */
export class EscalationManifestView {
  codeText: string;
  name: string;
  expiresAtText: string;
  checksum: string;
  costText: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    expiresAtText: string,
    checksum: string,
    costText: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.expiresAtText = expiresAtText;
    this.checksum = checksum;
    this.costText = costText;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toEscalationManifestView(item: EscalationManifest): EscalationManifestView {
  return new EscalationManifestView(
    item.code,
    item.name,
    String(item.expiresAt),
    item.checksum,
    item.cost.toFixed(2),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEscalationManifestViews(items: EscalationManifest[]): EscalationManifestView[] {
  const views: EscalationManifestView[] = [];
  for (const item of items) {
    views.push(toEscalationManifestView(item));
  }
  return views;
}

export function sumEscalationManifestView(view: EscalationManifestView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedExpiresAt + parsedCost + parsedScore;
}
