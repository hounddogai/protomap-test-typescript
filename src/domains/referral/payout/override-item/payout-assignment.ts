import * as text from "../../../../kit/text.js";

/** Where a payout assignment is in its life cycle. */
export type PayoutAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A payout assignment. Its code is unique within a tenant. */
export class PayoutAssignment {
  code: string;
  label: string;
  updatedAt: number;
  checksum: string;
  segment: string;
  attempts: number;
  conversionRate: number;
  pinned: boolean;
  ownerId: string;
  ratio: number;
  retries: number;
  status: PayoutAssignmentStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    checksum: string,
    segment: string,
    attempts: number,
    conversionRate: number,
    pinned: boolean,
    ownerId: string,
    ratio: number,
    retries: number,
    status: PayoutAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.checksum = checksum;
    this.segment = segment;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.ratio = ratio;
    this.retries = retries;
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

  canMoveTo(next: PayoutAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: PayoutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.attempts * this.conversionRate * 100) / 100;
  }

  copy(): PayoutAssignment {
    return new PayoutAssignment(
      this.code,
      this.label,
      this.updatedAt,
      this.checksum,
      this.segment,
      this.attempts,
      this.conversionRate,
      this.pinned,
      this.ownerId,
      this.ratio,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a payout assignment in status new. */
export function newPayoutAssignment(code: string, label: string): PayoutAssignment {
  return new PayoutAssignment(code, label, 0, "", "", 0, 0, false, "", 0, 0, "new");
}
