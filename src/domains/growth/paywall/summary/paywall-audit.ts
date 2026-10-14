import * as text from "../../../../kit/text.js";

/** Where a paywall audit is in its life cycle. */
export type PaywallAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a paywall audit and its current status. */
export class PaywallAudit {
  code: string;
  label: string;
  score: number;
  discount: number;
  segment: string;
  sendAt: number;
  summary: string;
  approved: boolean;
  updatedAt: number;
  batchSize: number;
  status: PaywallAuditStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    discount: number,
    segment: string,
    sendAt: number,
    summary: string,
    approved: boolean,
    updatedAt: number,
    batchSize: number,
    status: PaywallAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.discount = discount;
    this.segment = segment;
    this.sendAt = sendAt;
    this.summary = summary;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round(this.batchSize * this.updatedAt * 100) / 100;
  }

  copy(): PaywallAudit {
    return new PaywallAudit(
      this.code,
      this.label,
      this.score,
      this.discount,
      this.segment,
      this.sendAt,
      this.summary,
      this.approved,
      this.updatedAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a paywall audit in status open. */
export function newPaywallAudit(code: string, label: string): PaywallAudit {
  return new PaywallAudit(code, label, 0, 0, "", 0, "", false, 0, 0, "open");
}
