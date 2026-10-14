import { LenientJourneyGroup } from "./lenient-journey-group.js";

/** How screens and exports show a lenient journey group. */
export class LenientJourneyGroupView {
  code: string;
  title: string;
  startsAt: string;
  audienceId: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    startsAt: string,
    audienceId: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.audienceId = audienceId;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientJourneyGroupView(item: LenientJourneyGroup): LenientJourneyGroupView {
  return new LenientJourneyGroupView(
    item.code,
    item.title,
    String(item.startsAt),
    item.audienceId,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientJourneyGroupViews(items: LenientJourneyGroup[]): LenientJourneyGroupView[] {
  const views: LenientJourneyGroupView[] = [];
  for (const item of items) {
    views.push(toLenientJourneyGroupView(item));
  }
  return views;
}

export function sumLenientJourneyGroupView(view: LenientJourneyGroupView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedStartsAt;
}
