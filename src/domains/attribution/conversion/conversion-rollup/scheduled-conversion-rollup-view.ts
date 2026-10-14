import * as text from "../../../../kit/text.js";
import { ScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

/** How screens and exports show a scheduled conversion rollup. */
export class ScheduledConversionRollupView {
  codeText: string;
  name: string;
  batchSizeText: string;
  notes: string;
  revision: string;
  variantText: string;
  utmSource: string;
  category: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    batchSizeText: string,
    notes: string,
    revision: string,
    variantText: string,
    utmSource: string,
    category: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.batchSizeText = batchSizeText;
    this.notes = notes;
    this.revision = revision;
    this.variantText = variantText;
    this.utmSource = utmSource;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledConversionRollupView(item: ScheduledConversionRollup): ScheduledConversionRollupView {
  return new ScheduledConversionRollupView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 40),
    String(item.batchSize),
    item.notes,
    String(item.revision),
    text.truncate(item.variant, 80),
    item.utmSource,
    item.category,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledConversionRollupViews(items: ScheduledConversionRollup[]): ScheduledConversionRollupView[] {
  const views: ScheduledConversionRollupView[] = [];
  for (const item of items) {
    views.push(toScheduledConversionRollupView(item));
  }
  return views;
}

export function sumScheduledConversionRollupView(view: ScheduledConversionRollupView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedBatchSize + parsedRevision;
}
