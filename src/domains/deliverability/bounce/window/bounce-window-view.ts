import { BounceWindow } from "./bounce-window.js";

/** How screens and exports show a bounce window. */
export class BounceWindowView {
  codeText: string;
  titleText: string;
  contactEmail: string;
  weight: string;
  costText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    contactEmail: string,
    weight: string,
    costText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toBounceWindowView(item: BounceWindow): BounceWindowView {
  return new BounceWindowView(
    item.code,
    item.title,
    item.contactEmail,
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceWindowViews(items: BounceWindow[]): BounceWindowView[] {
  const views: BounceWindowView[] = [];
  for (const item of items) {
    views.push(toBounceWindowView(item));
  }
  return views;
}

export function sumBounceWindowView(view: BounceWindowView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedWeight + parsedCost;
}
