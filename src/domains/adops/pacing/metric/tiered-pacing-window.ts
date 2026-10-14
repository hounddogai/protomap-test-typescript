import * as text from "../../../../kit/text.js";

/** Where a tiered pacing window is in its life cycle. */
export type TieredPacingWindowStatus = "created" | "validated" | "published" | "retired";

/** A tiered pacing window. Its code is unique within a tenant. */
export class TieredPacingWindow {
  code: string;
  label: string;
  bid: number;
  phone: string;
  name: string;
  frequencyCap: number;
  status: TieredPacingWindowStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    phone: string,
    name: string,
    frequencyCap: number,
    status: TieredPacingWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.phone = phone;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredPacingWindowStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPacingWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round(this.frequencyCap * this.bid * 100) / 100;
  }

  copy(): TieredPacingWindow {
    return new TieredPacingWindow(
      this.code,
      this.label,
      this.bid,
      this.phone,
      this.name,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered pacing window in status created. */
export function newTieredPacingWindow(code: string, label: string): TieredPacingWindow {
  return new TieredPacingWindow(code, label, 0, "", "", 0, "created");
}
