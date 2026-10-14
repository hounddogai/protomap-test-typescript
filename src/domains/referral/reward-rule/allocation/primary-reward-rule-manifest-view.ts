import * as text from "../../../../kit/text.js";
import { PrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

/** How screens and exports show a primary reward rule manifest. */
export class PrimaryRewardRuleManifestView {
  codeText: string;
  nameText: string;
  pinnedText: string;
  currency: string;
  externalRefText: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    pinnedText: string,
    currency: string,
    externalRefText: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.pinnedText = pinnedText;
    this.currency = currency;
    this.externalRefText = externalRefText;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryRewardRuleManifestView(item: PrimaryRewardRuleManifest): PrimaryRewardRuleManifestView {
  return new PrimaryRewardRuleManifestView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.currency,
    text.truncate(item.externalRef, 80),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryRewardRuleManifestViews(items: PrimaryRewardRuleManifest[]): PrimaryRewardRuleManifestView[] {
  const views: PrimaryRewardRuleManifestView[] = [];
  for (const item of items) {
    views.push(toPrimaryRewardRuleManifestView(item));
  }
  return views;
}

export function sumPrimaryRewardRuleManifestView(view: PrimaryRewardRuleManifestView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
