import { LenientRewardRuleReservation } from "./lenient-reward-rule-reservation.js";

/** How screens and exports show a lenient reward rule reservation. */
export class LenientRewardRuleReservationView {
  code: string;
  name: string;
  floorValue: string;
  frequencyCap: string;
  notes: string;
  clicksText: string;
  approvedText: string;
  activeText: string;
  pinned: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    floorValue: string,
    frequencyCap: string,
    notes: string,
    clicksText: string,
    approvedText: string,
    activeText: string,
    pinned: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.clicksText = clicksText;
    this.approvedText = approvedText;
    this.activeText = activeText;
    this.pinned = pinned;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toLenientRewardRuleReservationView(item: LenientRewardRuleReservation): LenientRewardRuleReservationView {
  return new LenientRewardRuleReservationView(
    item.code,
    item.name,
    item.floorValue.toFixed(2),
    String(item.frequencyCap),
    item.notes,
    String(item.clicks),
    `${item.approved}`,
    `${item.active}`,
    `${item.pinned}`,
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientRewardRuleReservationViews(items: LenientRewardRuleReservation[]): LenientRewardRuleReservationView[] {
  const views: LenientRewardRuleReservationView[] = [];
  for (const item of items) {
    views.push(toLenientRewardRuleReservationView(item));
  }
  return views;
}

export function sumLenientRewardRuleReservationView(view: LenientRewardRuleReservationView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedFloorValue + parsedFrequencyCap + parsedClicks;
}
