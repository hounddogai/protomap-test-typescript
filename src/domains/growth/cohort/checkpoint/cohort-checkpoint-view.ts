import { CohortCheckpoint } from "./cohort-checkpoint.js";

/** How screens and exports show a cohort checkpoint. */
export class CohortCheckpointView {
  code: string;
  name: string;
  phone: string;
  durationMinutes: string;
  impressionsText: string;
  versionText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    phone: string,
    durationMinutes: string,
    impressionsText: string,
    versionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.durationMinutes = durationMinutes;
    this.impressionsText = impressionsText;
    this.versionText = versionText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortCheckpointView(item: CohortCheckpoint): CohortCheckpointView {
  return new CohortCheckpointView(
    item.code,
    item.name,
    item.phone,
    String(item.durationMinutes),
    String(item.impressions),
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortCheckpointViews(items: CohortCheckpoint[]): CohortCheckpointView[] {
  const views: CohortCheckpointView[] = [];
  for (const item of items) {
    views.push(toCohortCheckpointView(item));
  }
  return views;
}

export function sumCohortCheckpointView(view: CohortCheckpointView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedDurationMinutes + parsedImpressions + parsedVersion;
}
