import * as text from "../../../../kit/text.js";

/** Where a legacy window slot is in its life cycle. */
export type LegacyWindowSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy window slot. Its code is unique within a tenant. */
export class LegacyWindowSlot {
  code: string;
  title: string;
  visible: boolean;
  rate: number;
  country: string;
  sequence: number;
  active: boolean;
  status: LegacyWindowSlotStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    rate: number,
    country: string,
    sequence: number,
    active: boolean,
    status: LegacyWindowSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.rate = rate;
    this.country = country;
    this.sequence = sequence;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyWindowSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyWindowSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy window slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.rate - this.sequence) * 100) / 100;
  }

  copy(): LegacyWindowSlot {
    return new LegacyWindowSlot(
      this.code,
      this.title,
      this.visible,
      this.rate,
      this.country,
      this.sequence,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy window slot in status new. */
export function newLegacyWindowSlot(code: string, title: string): LegacyWindowSlot {
  return new LegacyWindowSlot(code, title, false, 0, "", 0, false, "new");
}
