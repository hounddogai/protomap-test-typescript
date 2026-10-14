import * as text from "../../../../kit/text.js";

/** Where a lenient payout score is in its life cycle. */
export type LenientPayoutScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient payout score and its current status. */
export class LenientPayoutScore {
  code: string;
  label: string;
  capacity: number;
  category: string;
  externalRef: string;
  description: string;
  status: LenientPayoutScoreStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    category: string,
    externalRef: string,
    description: string,
    status: LenientPayoutScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.category = category;
    this.externalRef = externalRef;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPayoutScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientPayoutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient payout score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): LenientPayoutScore {
    return new LenientPayoutScore(
      this.code,
      this.label,
      this.capacity,
      this.category,
      this.externalRef,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient payout score in status proposed. */
export function newLenientPayoutScore(code: string, label: string): LenientPayoutScore {
  return new LenientPayoutScore(code, label, 0, "", "", "", "proposed");
}
