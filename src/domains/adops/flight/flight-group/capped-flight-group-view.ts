import { CappedFlightGroup } from "./capped-flight-group.js";

/** How screens and exports show a capped flight group. */
export class CappedFlightGroupView {
  code: string;
  titleText: string;
  ceiling: string;
  campaignRef: string;
  startsAt: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    ceiling: string,
    campaignRef: string,
    startsAt: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toCappedFlightGroupView(item: CappedFlightGroup): CappedFlightGroupView {
  return new CappedFlightGroupView(
    item.code,
    item.title,
    item.ceiling.toFixed(2),
    item.campaignRef,
    String(item.startsAt),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedFlightGroupViews(items: CappedFlightGroup[]): CappedFlightGroupView[] {
  const views: CappedFlightGroupView[] = [];
  for (const item of items) {
    views.push(toCappedFlightGroupView(item));
  }
  return views;
}

export function sumCappedFlightGroupView(view: CappedFlightGroupView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCeiling + parsedStartsAt;
}
