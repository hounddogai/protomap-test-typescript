import * as text from "../../../../kit/text.js";

/** Where a payout notice is in its life cycle. */
export type PayoutNoticeStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout notice as the payout team keeps it. */
export class PayoutNotice {
  code: string;
  label: string;
  createdAt: number;
  summary: string;
  batchSize: number;
  status: PayoutNoticeStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    summary: string,
    batchSize: number,
    status: PayoutNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.summary = summary;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutNoticeStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.batchSize - this.createdAt) * 100) / 100;
  }

  copy(): PayoutNotice {
    return new PayoutNotice(this.code, this.label, this.createdAt, this.summary, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a payout notice in status requested. */
export function newPayoutNotice(code: string, label: string): PayoutNotice {
  return new PayoutNotice(code, label, 0, "", 0, "requested");
}
