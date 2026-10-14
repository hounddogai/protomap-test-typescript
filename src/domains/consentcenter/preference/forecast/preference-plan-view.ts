import * as text from "../../../../kit/text.js";
import { PreferencePlan } from "./preference-plan.js";

/** How screens and exports show a preference plan. */
export class PreferencePlanView {
  code: string;
  labelText: string;
  categoryText: string;
  title: string;
  ceilingText: string;
  revision: string;
  rate: string;
  minimumText: string;
  weight: string;
  countryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    categoryText: string,
    title: string,
    ceilingText: string,
    revision: string,
    rate: string,
    minimumText: string,
    weight: string,
    countryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.categoryText = categoryText;
    this.title = title;
    this.ceilingText = ceilingText;
    this.revision = revision;
    this.rate = rate;
    this.minimumText = minimumText;
    this.weight = weight;
    this.countryText = countryText;
    this.statusLabel = statusLabel;
  }
}

export function toPreferencePlanView(item: PreferencePlan): PreferencePlanView {
  return new PreferencePlanView(
    text.truncate(item.code, 64),
    item.label,
    item.category,
    text.truncate(item.title, 80),
    item.ceiling.toFixed(2),
    String(item.revision),
    item.rate.toFixed(2),
    item.minimum.toFixed(2),
    item.weight.toFixed(2),
    text.truncate(item.country, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferencePlanViews(items: PreferencePlan[]): PreferencePlanView[] {
  const views: PreferencePlanView[] = [];
  for (const item of items) {
    views.push(toPreferencePlanView(item));
  }
  return views;
}

export function sumPreferencePlanView(view: PreferencePlanView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCeiling + parsedRevision + parsedRate;
}
