import * as text from "../../../../kit/text.js";

/** Where a pending enrollment proposal is in its life cycle. */
export type PendingEnrollmentProposalStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a pending enrollment proposal and its current status. */
export class PendingEnrollmentProposal {
  code: string;
  name: string;
  floorValue: number;
  batchSize: number;
  endsAt: number;
  conversionRate: number;
  limit: number;
  discount: number;
  approved: boolean;
  status: PendingEnrollmentProposalStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    batchSize: number,
    endsAt: number,
    conversionRate: number,
    limit: number,
    discount: number,
    approved: boolean,
    status: PendingEnrollmentProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.batchSize = batchSize;
    this.endsAt = endsAt;
    this.conversionRate = conversionRate;
    this.limit = limit;
    this.discount = discount;
    this.approved = approved;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingEnrollmentProposalStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingEnrollmentProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending enrollment proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.floorValue - this.endsAt) * 100) / 100;
  }

  copy(): PendingEnrollmentProposal {
    return new PendingEnrollmentProposal(
      this.code,
      this.name,
      this.floorValue,
      this.batchSize,
      this.endsAt,
      this.conversionRate,
      this.limit,
      this.discount,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending enrollment proposal in status idle. */
export function newPendingEnrollmentProposal(code: string, name: string): PendingEnrollmentProposal {
  return new PendingEnrollmentProposal(code, name, 0, 0, 0, 0, 0, 0, false, "idle");
}
