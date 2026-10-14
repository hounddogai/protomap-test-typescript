import * as text from "../../../../kit/text.js";

/** Where a global opt out slot is in its life cycle. */
export type GlobalOptOutSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global opt out slot as the opt out team keeps it. */
export class GlobalOptOutSlot {
  code: string;
  name: string;
  windowDays: number;
  frequencyCap: number;
  source: string;
  status: GlobalOptOutSlotStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    frequencyCap: number,
    source: string,
    status: GlobalOptOutSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.frequencyCap = frequencyCap;
    this.source = source;
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

  canMoveTo(next: GlobalOptOutSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
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

  moveTo(next: GlobalOptOutSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global opt out slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global opt out slot"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.windowDays + this.frequencyCap) * 100) / 100;
  }

  copy(): GlobalOptOutSlot {
    return new GlobalOptOutSlot(this.code, this.name, this.windowDays, this.frequencyCap, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a global opt out slot in status draft. */
export function newGlobalOptOutSlot(code: string, name: string): GlobalOptOutSlot {
  return new GlobalOptOutSlot(code, name, 0, 0, "", "draft");
}
