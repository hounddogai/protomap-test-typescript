import { PrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

/** How screens and exports show a primary enrollment estimate. */
export class PrimaryEnrollmentEstimateView {
  code: string;
  name: string;
  unit: string;
  score: string;
  createdAt: string;
  statusLabel: string;

  constructor(code: string, name: string, unit: string, score: string, createdAt: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.score = score;
    this.createdAt = createdAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryEnrollmentEstimateView(item: PrimaryEnrollmentEstimate): PrimaryEnrollmentEstimateView {
  return new PrimaryEnrollmentEstimateView(
    item.code,
    item.name,
    item.unit,
    item.score.toFixed(2),
    String(item.createdAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryEnrollmentEstimateViews(items: PrimaryEnrollmentEstimate[]): PrimaryEnrollmentEstimateView[] {
  const views: PrimaryEnrollmentEstimateView[] = [];
  for (const item of items) {
    views.push(toPrimaryEnrollmentEstimateView(item));
  }
  return views;
}

export function sumPrimaryEnrollmentEstimateView(view: PrimaryEnrollmentEstimateView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedScore + parsedCreatedAt;
}
