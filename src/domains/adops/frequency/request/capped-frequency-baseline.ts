import * as text from "../../../../kit/text.js";

/** Where a capped frequency baseline is in its life cycle. */
export type CappedFrequencyBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped frequency baseline, with what the planners need to act on it. */
export class CappedFrequencyBaseline {
  code: string;
  name: string;
  quantity: number;
  discount: number;
  description: string;
  externalRef: string;
  attempts: number;
  openRate: number;
  status: CappedFrequencyBaselineStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    discount: number,
    description: string,
    externalRef: string,
    attempts: number,
    openRate: number,
    status: CappedFrequencyBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.discount = discount;
    this.description = description;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.openRate = openRate;
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

  canMoveTo(next: CappedFrequencyBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedFrequencyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveValue(): number {
    return Math.round(this.openRate * this.discount * 100) / 100;
  }

  copy(): CappedFrequencyBaseline {
    return new CappedFrequencyBaseline(
      this.code,
      this.name,
      this.quantity,
      this.discount,
      this.description,
      this.externalRef,
      this.attempts,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped frequency baseline in status new. */
export function newCappedFrequencyBaseline(code: string, name: string): CappedFrequencyBaseline {
  return new CappedFrequencyBaseline(code, name, 0, 0, "", "", 0, 0, "new");
}
