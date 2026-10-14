import * as text from "../../../../kit/text.js";

/** Where a seasonal badge slot is in its life cycle. */
export type SeasonalBadgeSlotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal badge slot and its current status. */
export class SeasonalBadgeSlot {
  code: string;
  name: string;
  archived: boolean;
  discount: number;
  phone: string;
  status: SeasonalBadgeSlotStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    discount: number,
    phone: string,
    status: SeasonalBadgeSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.discount = discount;
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

  canMoveTo(next: SeasonalBadgeSlotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: SeasonalBadgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal badge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal badge slot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): SeasonalBadgeSlot {
    return new SeasonalBadgeSlot(this.code, this.name, this.archived, this.discount, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal badge slot in status planned. */
export function newSeasonalBadgeSlot(code: string, name: string): SeasonalBadgeSlot {
  return new SeasonalBadgeSlot(code, name, false, 0, "", "planned");
}
