import * as text from "../../../../kit/text.js";

/** Where a double opt in rollup is in its life cycle. */
export type DoubleOptInRollupStatus = "created" | "validated" | "published" | "retired";

/** A double opt in rollup as the double opt in team keeps it. */
export class DoubleOptInRollup {
  code: string;
  label: string;
  rate: number;
  sendAt: number;
  discount: number;
  pinned: boolean;
  threshold: number;
  status: DoubleOptInRollupStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    sendAt: number,
    discount: number,
    pinned: boolean,
    threshold: number,
    status: DoubleOptInRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.sendAt = sendAt;
    this.discount = discount;
    this.pinned = pinned;
    this.threshold = threshold;
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

  canMoveTo(next: DoubleOptInRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
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

  moveTo(next: DoubleOptInRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold - this.discount) * 100) / 100;
  }

  copy(): DoubleOptInRollup {
    return new DoubleOptInRollup(
      this.code,
      this.label,
      this.rate,
      this.sendAt,
      this.discount,
      this.pinned,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a double opt in rollup in status created. */
export function newDoubleOptInRollup(code: string, label: string): DoubleOptInRollup {
  return new DoubleOptInRollup(code, label, 0, 0, 0, false, 0, "created");
}
