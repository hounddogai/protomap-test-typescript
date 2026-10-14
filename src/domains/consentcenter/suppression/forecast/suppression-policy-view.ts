import * as text from "../../../../kit/text.js";
import { SuppressionPolicy } from "./suppression-policy.js";

/** How screens and exports show a suppression policy. */
export class SuppressionPolicyView {
  codeText: string;
  label: string;
  batchSize: string;
  revision: string;
  description: string;
  impressions: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    batchSize: string,
    revision: string,
    description: string,
    impressions: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.batchSize = batchSize;
    this.revision = revision;
    this.description = description;
    this.impressions = impressions;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionPolicyView(item: SuppressionPolicy): SuppressionPolicyView {
  return new SuppressionPolicyView(
    item.code,
    item.label,
    String(item.batchSize),
    String(item.revision),
    item.description,
    String(item.impressions),
    text.truncate(item.phone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionPolicyViews(items: SuppressionPolicy[]): SuppressionPolicyView[] {
  const views: SuppressionPolicyView[] = [];
  for (const item of items) {
    views.push(toSuppressionPolicyView(item));
  }
  return views;
}

export function sumSuppressionPolicyView(view: SuppressionPolicyView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedBatchSize + parsedRevision + parsedImpressions;
}
