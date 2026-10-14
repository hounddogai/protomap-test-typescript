import * as text from "../../../../kit/text.js";
import { MacroMetric } from "./macro-metric.js";

/** How screens and exports show a macro metric. */
export class MacroMetricView {
  codeText: string;
  name: string;
  frequencyCapText: string;
  approved: string;
  label: string;
  regionText: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    frequencyCapText: string,
    approved: string,
    label: string,
    regionText: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.frequencyCapText = frequencyCapText;
    this.approved = approved;
    this.label = label;
    this.regionText = regionText;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toMacroMetricView(item: MacroMetric): MacroMetricView {
  return new MacroMetricView(
    text.truncate(item.code, 80),
    item.name,
    String(item.frequencyCap),
    `${item.approved}`,
    item.label,
    item.region,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toMacroMetricViews(items: MacroMetric[]): MacroMetricView[] {
  const views: MacroMetricView[] = [];
  for (const item of items) {
    views.push(toMacroMetricView(item));
  }
  return views;
}

export function sumMacroMetricView(view: MacroMetricView): number {
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedFrequencyCap;
}
