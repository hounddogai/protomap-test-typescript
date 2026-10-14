import * as text from "../../../../kit/text.js";

/** Where a wait audit is in its life cycle. */
export type WaitAuditStatus = "created" | "validated" | "published" | "retired";

/** One wait audit, with what the planners need to act on it. */
export class WaitAudit {
  code: string;
  name: string;
  quantity: number;
  audienceId: string;
  variant: string;
  cohort: string;
  bid: number;
  reviewer: string;
  campaignRef: string;
  status: WaitAuditStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    audienceId: string,
    variant: string,
    cohort: string,
    bid: number,
    reviewer: string,
    campaignRef: string,
    status: WaitAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.variant = variant;
    this.cohort = cohort;
    this.bid = bid;
    this.reviewer = reviewer;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: WaitAuditStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WaitAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity + this.bid) * 100) / 100;
  }

  copy(): WaitAudit {
    return new WaitAudit(
      this.code,
      this.name,
      this.quantity,
      this.audienceId,
      this.variant,
      this.cohort,
      this.bid,
      this.reviewer,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a wait audit in status created. */
export function newWaitAudit(code: string, name: string): WaitAudit {
  return new WaitAudit(code, name, 0, "", "", "", 0, "", "", "created");
}
