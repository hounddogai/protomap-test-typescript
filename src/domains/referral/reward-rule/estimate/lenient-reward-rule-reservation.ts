import * as text from "../../../../kit/text.js";

/** Where a lenient reward rule reservation is in its life cycle. */
export type LenientRewardRuleReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient reward rule reservation, with what the planners need to act on it. */
export class LenientRewardRuleReservation {
  code: string;
  name: string;
  floorValue: number;
  frequencyCap: number;
  notes: string;
  clicks: number;
  approved: boolean;
  attributes: Map<string, string>;
  active: boolean;
  pinned: boolean;
  phone: string;
  status: LenientRewardRuleReservationStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    frequencyCap: number,
    notes: string,
    clicks: number,
    approved: boolean,
    attributes: Map<string, string>,
    active: boolean,
    pinned: boolean,
    phone: string,
    status: LenientRewardRuleReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.clicks = clicks;
    this.approved = approved;
    this.attributes = attributes;
    this.active = active;
    this.pinned = pinned;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientRewardRuleReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientRewardRuleReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient reward rule reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round(this.floorValue * this.clicks * 100) / 100;
  }

  copy(): LenientRewardRuleReservation {
    return new LenientRewardRuleReservation(
      this.code,
      this.name,
      this.floorValue,
      this.frequencyCap,
      this.notes,
      this.clicks,
      this.approved,
      this.attributes,
      this.active,
      this.pinned,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient reward rule reservation in status planned. */
export function newLenientRewardRuleReservation(code: string, name: string): LenientRewardRuleReservation {
  return new LenientRewardRuleReservation(
    code,
    name,
    0,
    0,
    "",
    0,
    false,
    new Map<string, string>(),
    false,
    false,
    "",
    "planned",
  );
}
