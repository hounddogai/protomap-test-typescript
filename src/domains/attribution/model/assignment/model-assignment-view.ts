import { ModelAssignment } from "./model-assignment.js";

/** How screens and exports show a model assignment. */
export class ModelAssignmentView {
  code: string;
  label: string;
  utmSource: string;
  region: string;
  countryText: string;
  description: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    region: string,
    countryText: string,
    description: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.region = region;
    this.countryText = countryText;
    this.description = description;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toModelAssignmentView(item: ModelAssignment): ModelAssignmentView {
  return new ModelAssignmentView(
    item.code,
    item.label,
    item.utmSource,
    item.region,
    item.country,
    item.description,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelAssignmentViews(items: ModelAssignment[]): ModelAssignmentView[] {
  const views: ModelAssignmentView[] = [];
  for (const item of items) {
    views.push(toModelAssignmentView(item));
  }
  return views;
}

export function sumModelAssignmentView(view: ModelAssignmentView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedUpdatedAt;
}
