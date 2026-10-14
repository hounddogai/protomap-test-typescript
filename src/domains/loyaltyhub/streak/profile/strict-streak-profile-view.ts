import { StrictStreakProfile } from "./strict-streak-profile.js";

/** How screens and exports show a strict streak profile. */
export class StrictStreakProfileView {
  codeText: string;
  name: string;
  capacity: string;
  utmSourceText: string;
  sendAt: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    capacity: string,
    utmSourceText: string,
    sendAt: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.capacity = capacity;
    this.utmSourceText = utmSourceText;
    this.sendAt = sendAt;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictStreakProfileView(item: StrictStreakProfile): StrictStreakProfileView {
  return new StrictStreakProfileView(
    item.code,
    item.name,
    String(item.capacity),
    item.utmSource,
    String(item.sendAt),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictStreakProfileViews(items: StrictStreakProfile[]): StrictStreakProfileView[] {
  const views: StrictStreakProfileView[] = [];
  for (const item of items) {
    views.push(toStrictStreakProfileView(item));
  }
  return views;
}

export function sumStrictStreakProfileView(view: StrictStreakProfileView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedCapacity + parsedSendAt;
}
