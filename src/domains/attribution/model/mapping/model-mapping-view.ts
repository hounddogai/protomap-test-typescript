import * as text from "../../../../kit/text.js";
import { ModelMapping } from "./model-mapping.js";

/** How screens and exports show a model mapping. */
export class ModelMappingView {
  code: string;
  label: string;
  pinnedText: string;
  approvedText: string;
  category: string;
  ratio: string;
  cohortText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    pinnedText: string,
    approvedText: string,
    category: string,
    ratio: string,
    cohortText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.pinnedText = pinnedText;
    this.approvedText = approvedText;
    this.category = category;
    this.ratio = ratio;
    this.cohortText = cohortText;
    this.statusLabel = statusLabel;
  }
}

export function toModelMappingView(item: ModelMapping): ModelMappingView {
  return new ModelMappingView(
    item.code,
    text.truncate(item.label, 40),
    `${item.pinned}`,
    `${item.approved}`,
    item.category,
    item.ratio.toFixed(2),
    text.truncate(item.cohort, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toModelMappingViews(items: ModelMapping[]): ModelMappingView[] {
  const views: ModelMappingView[] = [];
  for (const item of items) {
    views.push(toModelMappingView(item));
  }
  return views;
}

export function sumModelMappingView(view: ModelMappingView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
