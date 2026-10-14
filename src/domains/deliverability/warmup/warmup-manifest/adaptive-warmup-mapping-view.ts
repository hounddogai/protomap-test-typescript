import * as text from "../../../../kit/text.js";
import { AdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

/** How screens and exports show a adaptive warmup mapping. */
export class AdaptiveWarmupMappingView {
  code: string;
  nameText: string;
  ceiling: string;
  title: string;
  sourceText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    ceiling: string,
    title: string,
    sourceText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.ceiling = ceiling;
    this.title = title;
    this.sourceText = sourceText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveWarmupMappingView(item: AdaptiveWarmupMapping): AdaptiveWarmupMappingView {
  return new AdaptiveWarmupMappingView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 80),
    item.ceiling.toFixed(2),
    item.title,
    text.truncate(item.source, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveWarmupMappingViews(items: AdaptiveWarmupMapping[]): AdaptiveWarmupMappingView[] {
  const views: AdaptiveWarmupMappingView[] = [];
  for (const item of items) {
    views.push(toAdaptiveWarmupMappingView(item));
  }
  return views;
}

export function sumAdaptiveWarmupMappingView(view: AdaptiveWarmupMappingView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}
