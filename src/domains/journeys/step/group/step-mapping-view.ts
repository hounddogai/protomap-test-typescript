import * as text from "../../../../kit/text.js";
import { StepMapping } from "./step-mapping.js";

/** How screens and exports show a step mapping. */
export class StepMappingView {
  code: string;
  label: string;
  revision: string;
  impressions: string;
  createdAtText: string;
  variant: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    revision: string,
    impressions: string,
    createdAtText: string,
    variant: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.impressions = impressions;
    this.createdAtText = createdAtText;
    this.variant = variant;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toStepMappingView(item: StepMapping): StepMappingView {
  return new StepMappingView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    String(item.revision),
    String(item.impressions),
    String(item.createdAt),
    item.variant,
    text.truncate(item.timezone, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toStepMappingViews(items: StepMapping[]): StepMappingView[] {
  const views: StepMappingView[] = [];
  for (const item of items) {
    views.push(toStepMappingView(item));
  }
  return views;
}

export function sumStepMappingView(view: StepMappingView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCreatedAt = Number(view.createdAtText);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAtText} is not a number`);
  return parsedRevision + parsedImpressions + parsedCreatedAt;
}
