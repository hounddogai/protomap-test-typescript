import * as text from "../../../../kit/text.js";

/** Where a opt out slot is in its life cycle. */
export type OptOutSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One opt out slot, with what the planners need to act on it. */
export class OptOutSlot {
  code: string;
  title: string;
  timezone: string;
  cohort: string;
  pinned: boolean;
  quantity: number;
  status: OptOutSlotStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    cohort: string,
    pinned: boolean,
    quantity: number,
    status: OptOutSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.cohort = cohort;
    this.pinned = pinned;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): OptOutSlot {
    return new OptOutSlot(this.code, this.title, this.timezone, this.cohort, this.pinned, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a opt out slot in status draft. */
export function newOptOutSlot(code: string, title: string): OptOutSlot {
  return new OptOutSlot(code, title, "", "", false, 0, "draft");
}
