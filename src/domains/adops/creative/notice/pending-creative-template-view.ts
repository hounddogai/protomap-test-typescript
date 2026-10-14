import { PendingCreativeTemplate } from "./pending-creative-template.js";

/** How screens and exports show a pending creative template. */
export class PendingCreativeTemplateView {
  code: string;
  name: string;
  ceiling: string;
  capacity: string;
  journeyId: string;
  description: string;
  audienceId: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ceiling: string,
    capacity: string,
    journeyId: string,
    description: string,
    audienceId: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.description = description;
    this.audienceId = audienceId;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPendingCreativeTemplateView(item: PendingCreativeTemplate): PendingCreativeTemplateView {
  return new PendingCreativeTemplateView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    String(item.capacity),
    item.journeyId,
    item.description,
    item.audienceId,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingCreativeTemplateViews(items: PendingCreativeTemplate[]): PendingCreativeTemplateView[] {
  const views: PendingCreativeTemplateView[] = [];
  for (const item of items) {
    views.push(toPendingCreativeTemplateView(item));
  }
  return views;
}

export function sumPendingCreativeTemplateView(view: PendingCreativeTemplateView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedCeiling + parsedCapacity;
}
