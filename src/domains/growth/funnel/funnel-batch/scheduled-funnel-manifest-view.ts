import { ScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

/** How screens and exports show a scheduled funnel manifest. */
export class ScheduledFunnelManifestView {
  codeText: string;
  name: string;
  approved: string;
  minimum: string;
  visible: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    approved: string,
    minimum: string,
    visible: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.approved = approved;
    this.minimum = minimum;
    this.visible = visible;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledFunnelManifestView(item: ScheduledFunnelManifest): ScheduledFunnelManifestView {
  return new ScheduledFunnelManifestView(
    item.code,
    item.name,
    `${item.approved}`,
    item.minimum.toFixed(2),
    `${item.visible}`,
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledFunnelManifestViews(items: ScheduledFunnelManifest[]): ScheduledFunnelManifestView[] {
  const views: ScheduledFunnelManifestView[] = [];
  for (const item of items) {
    views.push(toScheduledFunnelManifestView(item));
  }
  return views;
}

export function sumScheduledFunnelManifestView(view: ScheduledFunnelManifestView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  return parsedMinimum + parsedScore;
}
