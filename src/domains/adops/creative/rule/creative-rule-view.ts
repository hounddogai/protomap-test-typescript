import * as text from "../../../../kit/text.js";
import { CreativeRule } from "./creative-rule.js";

/** How screens and exports show a creative rule. */
export class CreativeRuleView {
  code: string;
  titleText: string;
  sequence: string;
  ceiling: string;
  channel: string;
  conversionRate: string;
  createdAtText: string;
  openRate: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    sequence: string,
    ceiling: string,
    channel: string,
    conversionRate: string,
    createdAtText: string,
    openRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.channel = channel;
    this.conversionRate = conversionRate;
    this.createdAtText = createdAtText;
    this.openRate = openRate;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeRuleView(item: CreativeRule): CreativeRuleView {
  return new CreativeRuleView(
    item.code,
    text.truncate(item.title, 64),
    String(item.sequence),
    item.ceiling.toFixed(2),
    item.channel,
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.openRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeRuleViews(items: CreativeRule[]): CreativeRuleView[] {
  const views: CreativeRuleView[] = [];
  for (const item of items) {
    views.push(toCreativeRuleView(item));
  }
  return views;
}

export function sumCreativeRuleView(view: CreativeRuleView): number {
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedSequence + parsedCeiling + parsedConversionRate;
}
