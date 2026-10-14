import * as text from "../../../../kit/text.js";

/** Where a redemption agreement is in its life cycle. */
export type RedemptionAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a redemption agreement and its current status. */
export class RedemptionAgreement {
  code: string;
  label: string;
  cohort: string;
  sendAt: number;
  source: string;
  graceDays: number;
  segment: string;
  discount: number;
  quantity: number;
  amount: number;
  bid: number;
  status: RedemptionAgreementStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    sendAt: number,
    source: string,
    graceDays: number,
    segment: string,
    discount: number,
    quantity: number,
    amount: number,
    bid: number,
    status: RedemptionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.source = source;
    this.graceDays = graceDays;
    this.segment = segment;
    this.discount = discount;
    this.quantity = quantity;
    this.amount = amount;
    this.bid = bid;
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

  canMoveTo(next: RedemptionAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: RedemptionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedLoad(): number {
    return Math.round(this.sendAt * this.bid * 100) / 100;
  }

  copy(): RedemptionAgreement {
    return new RedemptionAgreement(
      this.code,
      this.label,
      this.cohort,
      this.sendAt,
      this.source,
      this.graceDays,
      this.segment,
      this.discount,
      this.quantity,
      this.amount,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a redemption agreement in status new. */
export function newRedemptionAgreement(code: string, label: string): RedemptionAgreement {
  return new RedemptionAgreement(code, label, "", 0, "", 0, "", 0, 0, 0, 0, "new");
}
