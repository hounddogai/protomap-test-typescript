import { PreferenceSlot } from "./preference-slot.js";

/** How screens and exports show a preference slot. */
export class PreferenceSlotView {
  code: string;
  nameText: string;
  attemptsText: string;
  limit: string;
  visible: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    attemptsText: string,
    limit: string,
    visible: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.attemptsText = attemptsText;
    this.limit = limit;
    this.visible = visible;
    this.statusLabel = statusLabel;
  }
}

export function toPreferenceSlotView(item: PreferenceSlot): PreferenceSlotView {
  return new PreferenceSlotView(
    item.code,
    item.name,
    String(item.attempts),
    String(item.limit),
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPreferenceSlotViews(items: PreferenceSlot[]): PreferenceSlotView[] {
  const views: PreferenceSlotView[] = [];
  for (const item of items) {
    views.push(toPreferenceSlotView(item));
  }
  return views;
}

export function sumPreferenceSlotView(view: PreferenceSlotView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedAttempts + parsedLimit;
}
