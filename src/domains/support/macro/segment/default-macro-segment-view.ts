import { DefaultMacroSegment } from "./default-macro-segment.js";

/** How screens and exports show a default macro segment. */
export class DefaultMacroSegmentView {
  codeText: string;
  label: string;
  version: string;
  rateText: string;
  ceiling: string;
  name: string;
  weight: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    version: string,
    rateText: string,
    ceiling: string,
    name: string,
    weight: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.version = version;
    this.rateText = rateText;
    this.ceiling = ceiling;
    this.name = name;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMacroSegmentView(item: DefaultMacroSegment): DefaultMacroSegmentView {
  return new DefaultMacroSegmentView(
    item.code,
    item.label,
    String(item.version),
    item.rate.toFixed(2),
    item.ceiling.toFixed(2),
    item.name,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMacroSegmentViews(items: DefaultMacroSegment[]): DefaultMacroSegmentView[] {
  const views: DefaultMacroSegmentView[] = [];
  for (const item of items) {
    views.push(toDefaultMacroSegmentView(item));
  }
  return views;
}

export function sumDefaultMacroSegmentView(view: DefaultMacroSegmentView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedVersion + parsedRate + parsedCeiling;
}
