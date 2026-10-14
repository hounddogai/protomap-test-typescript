import * as text from "../../../../kit/text.js";

/** Where a legacy payout assignment is in its life cycle. */
export type LegacyPayoutAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy payout assignment as the payout team keeps it. */
export class LegacyPayoutAssignment {
  code: string;
  label: string;
  bid: number;
  sendAt: number;
  updatedAt: number;
  score: number;
  limit: number;
  contactEmail: string;
  budget: number;
  variant: string;
  status: LegacyPayoutAssignmentStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    sendAt: number,
    updatedAt: number,
    score: number,
    limit: number,
    contactEmail: string,
    budget: number,
    variant: string,
    status: LegacyPayoutAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.sendAt = sendAt;
    this.updatedAt = updatedAt;
    this.score = score;
    this.limit = limit;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.variant = variant;
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

  canMoveTo(next: LegacyPayoutAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyPayoutAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy payout assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy payout assignment"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sendAt + this.updatedAt) * 100) / 100;
  }

  copy(): LegacyPayoutAssignment {
    return new LegacyPayoutAssignment(
      this.code,
      this.label,
      this.bid,
      this.sendAt,
      this.updatedAt,
      this.score,
      this.limit,
      this.contactEmail,
      this.budget,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy payout assignment in status new. */
export function newLegacyPayoutAssignment(code: string, label: string): LegacyPayoutAssignment {
  return new LegacyPayoutAssignment(code, label, 0, 0, 0, 0, 0, "", 0, "", "new");
}
