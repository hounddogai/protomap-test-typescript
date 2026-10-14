import * as text from "../../../../kit/text.js";
import { AdaptiveNudgeMapping } from "./adaptive-nudge-mapping.js";

/** How screens and exports show a adaptive nudge mapping. */
export class AdaptiveNudgeMappingView {
  code: string;
  name: string;
  variant: string;
  unit: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    variant: string,
    unit: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.unit = unit;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveNudgeMappingView(item: AdaptiveNudgeMapping): AdaptiveNudgeMappingView {
  return new AdaptiveNudgeMappingView(
    item.code,
    text.truncate(item.name, 40),
    item.variant,
    text.truncate(item.unit, 40),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveNudgeMappingViews(items: AdaptiveNudgeMapping[]): AdaptiveNudgeMappingView[] {
  const views: AdaptiveNudgeMappingView[] = [];
  for (const item of items) {
    views.push(toAdaptiveNudgeMappingView(item));
  }
  return views;
}

export function sumAdaptiveNudgeMappingView(view: AdaptiveNudgeMappingView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedThreshold;
}
