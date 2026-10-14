import * as text from "../../../../kit/text.js";

/** Where a redemption digest is in its life cycle. */
export type RedemptionDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One redemption digest, with what the planners need to act on it. */
export class RedemptionDigest {
  code: string;
  label: string;
  minimum: number;
  endsAt: number;
  quantity: number;
  visible: boolean;
  notes: string;
  name: string;
  discount: number;
  status: RedemptionDigestStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    endsAt: number,
    quantity: number,
    visible: boolean,
    notes: string,
    name: string,
    discount: number,
    status: RedemptionDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.quantity = quantity;
    this.visible = visible;
    this.notes = notes;
    this.name = name;
    this.discount = discount;
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

  canMoveTo(next: RedemptionDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.discount - this.quantity) * 100) / 100;
  }

  copy(): RedemptionDigest {
    return new RedemptionDigest(
      this.code,
      this.label,
      this.minimum,
      this.endsAt,
      this.quantity,
      this.visible,
      this.notes,
      this.name,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption digest in status proposed. */
export function newRedemptionDigest(code: string, label: string): RedemptionDigest {
  return new RedemptionDigest(code, label, 0, 0, 0, false, "", "", 0, "proposed");
}
