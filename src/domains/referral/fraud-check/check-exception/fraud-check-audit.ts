import * as text from "../../../../kit/text.js";

/** Where a fraud check audit is in its life cycle. */
export type FraudCheckAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fraud check audit, with what the planners need to act on it. */
export class FraudCheckAudit {
  code: string;
  label: string;
  retries: number;
  ceiling: number;
  score: number;
  clicks: number;
  title: string;
  status: FraudCheckAuditStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    ceiling: number,
    score: number,
    clicks: number,
    title: string,
    status: FraudCheckAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.ceiling = ceiling;
    this.score = score;
    this.clicks = clicks;
    this.title = title;
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

  canMoveTo(next: FraudCheckAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.ceiling + this.score) * 100) / 100;
  }

  copy(): FraudCheckAudit {
    return new FraudCheckAudit(
      this.code,
      this.label,
      this.retries,
      this.ceiling,
      this.score,
      this.clicks,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check audit in status open. */
export function newFraudCheckAudit(code: string, label: string): FraudCheckAudit {
  return new FraudCheckAudit(code, label, 0, 0, 0, 0, "", "open");
}
