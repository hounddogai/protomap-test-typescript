import * as text from "../../../../kit/text.js";
import { CreativeMilestone } from "./creative-milestone.js";

/** How screens and exports show a creative milestone. */
export class CreativeMilestoneView {
  code: string;
  name: string;
  capacityText: string;
  active: string;
  versionText: string;
  localeText: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    capacityText: string,
    active: string,
    versionText: string,
    localeText: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.capacityText = capacityText;
    this.active = active;
    this.versionText = versionText;
    this.localeText = localeText;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeMilestoneView(item: CreativeMilestone): CreativeMilestoneView {
  return new CreativeMilestoneView(
    item.code,
    text.truncate(item.name, 64),
    String(item.capacity),
    `${item.active}`,
    String(item.version),
    text.truncate(item.locale, 64),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeMilestoneViews(items: CreativeMilestone[]): CreativeMilestoneView[] {
  const views: CreativeMilestoneView[] = [];
  for (const item of items) {
    views.push(toCreativeMilestoneView(item));
  }
  return views;
}

export function sumCreativeMilestoneView(view: CreativeMilestoneView): number {
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedCapacity + parsedVersion;
}
