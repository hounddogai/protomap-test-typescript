import * as text from "../../../../kit/text.js";

/** Where a step audit is in its life cycle. */
export type StepAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a step audit and its current status. */
export class StepAudit {
  code: string;
  title: string;
  rate: number;
  pinned: boolean;
  impressions: number;
  amount: number;
  segment: string;
  version: number;
  variant: string;
  status: StepAuditStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    pinned: boolean,
    impressions: number,
    amount: number,
    segment: string,
    version: number,
    variant: string,
    status: StepAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.pinned = pinned;
    this.impressions = impressions;
    this.amount = amount;
    this.segment = segment;
    this.version = version;
    this.variant = variant;
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

  canMoveTo(next: StepAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StepAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"step audit"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.version - this.rate) * 100) / 100;
  }

  copy(): StepAudit {
    return new StepAudit(
      this.code,
      this.title,
      this.rate,
      this.pinned,
      this.impressions,
      this.amount,
      this.segment,
      this.version,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a step audit in status requested. */
export function newStepAudit(code: string, title: string): StepAudit {
  return new StepAudit(code, title, 0, false, 0, 0, "", 0, "", "requested");
}
