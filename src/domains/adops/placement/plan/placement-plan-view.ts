import { PlacementPlan } from "./placement-plan.js";

/** How screens and exports show a placement plan. */
export class PlacementPlanView {
  code: string;
  name: string;
  locale: string;
  channelText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    channelText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.channelText = channelText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementPlanView(item: PlacementPlan): PlacementPlanView {
  return new PlacementPlanView(
    item.code,
    item.name,
    item.locale,
    item.channel,
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementPlanViews(items: PlacementPlan[]): PlacementPlanView[] {
  const views: PlacementPlanView[] = [];
  for (const item of items) {
    views.push(toPlacementPlanView(item));
  }
  return views;
}

export function sumPlacementPlanView(view: PlacementPlanView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedUpdatedAt;
}
