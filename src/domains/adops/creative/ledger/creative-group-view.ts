import * as text from "../../../../kit/text.js";
import { CreativeGroup } from "./creative-group.js";

/** How screens and exports show a creative group. */
export class CreativeGroupView {
  codeText: string;
  title: string;
  weight: string;
  limit: string;
  ceiling: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    weight: string,
    limit: string,
    ceiling: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.weight = weight;
    this.limit = limit;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeGroupView(item: CreativeGroup): CreativeGroupView {
  return new CreativeGroupView(
    text.truncate(item.code, 80),
    item.title,
    item.weight.toFixed(2),
    String(item.limit),
    item.ceiling.toFixed(2),
    text.truncate(item.externalRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeGroupViews(items: CreativeGroup[]): CreativeGroupView[] {
  const views: CreativeGroupView[] = [];
  for (const item of items) {
    views.push(toCreativeGroupView(item));
  }
  return views;
}

export function sumCreativeGroupView(view: CreativeGroupView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedWeight + parsedLimit + parsedCeiling;
}
