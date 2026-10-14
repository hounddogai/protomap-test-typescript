import { ManualFrequencyManifest } from "./manual-frequency-manifest.js";

/** How screens and exports show a manual frequency manifest. */
export class ManualFrequencyManifestView {
  codeText: string;
  label: string;
  limit: string;
  attempts: string;
  retries: string;
  weightText: string;
  durationMinutes: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    limit: string,
    attempts: string,
    retries: string,
    weightText: string,
    durationMinutes: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.limit = limit;
    this.attempts = attempts;
    this.retries = retries;
    this.weightText = weightText;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toManualFrequencyManifestView(item: ManualFrequencyManifest): ManualFrequencyManifestView {
  return new ManualFrequencyManifestView(
    item.code,
    item.label,
    String(item.limit),
    String(item.attempts),
    String(item.retries),
    item.weight.toFixed(2),
    String(item.durationMinutes),
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualFrequencyManifestViews(items: ManualFrequencyManifest[]): ManualFrequencyManifestView[] {
  const views: ManualFrequencyManifestView[] = [];
  for (const item of items) {
    views.push(toManualFrequencyManifestView(item));
  }
  return views;
}

export function sumManualFrequencyManifestView(view: ManualFrequencyManifestView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedLimit + parsedAttempts + parsedRetries;
}
