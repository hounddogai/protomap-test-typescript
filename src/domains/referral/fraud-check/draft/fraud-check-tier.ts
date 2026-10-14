import * as text from "../../../../kit/text.js";

/** Where a fraud check tier is in its life cycle. */
export type FraudCheckTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fraud check tier. Its code is unique within a tenant. */
export class FraudCheckTier {
  code: string;
  label: string;
  pinned: boolean;
  sequence: number;
  variant: string;
  maximum: number;
  status: FraudCheckTierStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    sequence: number,
    variant: string,
    maximum: number,
    status: FraudCheckTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.sequence = sequence;
    this.variant = variant;
    this.maximum = maximum;
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

  canMoveTo(next: FraudCheckTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.maximum - this.sequence) * 100) / 100;
  }

  copy(): FraudCheckTier {
    return new FraudCheckTier(
      this.code,
      this.label,
      this.pinned,
      this.sequence,
      this.variant,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check tier in status proposed. */
export function newFraudCheckTier(code: string, label: string): FraudCheckTier {
  return new FraudCheckTier(code, label, false, 0, "", 0, "proposed");
}
