import * as text from "../../../../kit/text.js";
import { LegacyEscalationBatch } from "./legacy-escalation-batch.js";

/** How screens and exports show a legacy escalation batch. */
export class LegacyEscalationBatchView {
  code: string;
  name: string;
  segment: string;
  summary: string;
  active: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    segment: string,
    summary: string,
    active: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.summary = summary;
    this.active = active;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyEscalationBatchView(item: LegacyEscalationBatch): LegacyEscalationBatchView {
  return new LegacyEscalationBatchView(
    item.code,
    text.truncate(item.name, 80),
    item.segment,
    text.truncate(item.summary, 120),
    `${item.active}`,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyEscalationBatchViews(items: LegacyEscalationBatch[]): LegacyEscalationBatchView[] {
  const views: LegacyEscalationBatchView[] = [];
  for (const item of items) {
    views.push(toLegacyEscalationBatchView(item));
  }
  return views;
}

export function sumLegacyEscalationBatchView(view: LegacyEscalationBatchView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCeiling;
}
