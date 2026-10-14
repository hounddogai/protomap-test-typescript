import { RollingNudgeMapping } from "./rolling-nudge-mapping.js";

/** How screens and exports show a rolling nudge mapping. */
export class RollingNudgeMappingView {
  code: string;
  titleText: string;
  unit: string;
  channelText: string;
  country: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    unit: string,
    channelText: string,
    country: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.unit = unit;
    this.channelText = channelText;
    this.country = country;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeMappingView(item: RollingNudgeMapping): RollingNudgeMappingView {
  return new RollingNudgeMappingView(
    item.code,
    item.title,
    item.unit,
    item.channel,
    item.country,
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeMappingViews(items: RollingNudgeMapping[]): RollingNudgeMappingView[] {
  const views: RollingNudgeMappingView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeMappingView(item));
  }
  return views;
}

export function sumRollingNudgeMappingView(view: RollingNudgeMappingView): number {
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedQuantity;
}
