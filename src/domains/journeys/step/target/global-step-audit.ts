import * as text from "../../../../kit/text.js";

/** Where a global step audit is in its life cycle. */
export type GlobalStepAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global step audit. Its code is unique within a tenant. */
export class GlobalStepAudit {
  code: string;
  label: string;
  journeyId: string;
  threshold: number;
  region: string;
  limit: number;
  score: number;
  conversionRate: number;
  status: GlobalStepAuditStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    threshold: number,
    region: string,
    limit: number,
    score: number,
    conversionRate: number,
    status: GlobalStepAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.region = region;
    this.limit = limit;
    this.score = score;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalStepAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalStepAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global step audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedValue(): number {
    return Math.round((this.score - this.limit) * 100) / 100;
  }

  copy(): GlobalStepAudit {
    return new GlobalStepAudit(
      this.code,
      this.label,
      this.journeyId,
      this.threshold,
      this.region,
      this.limit,
      this.score,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global step audit in status planned. */
export function newGlobalStepAudit(code: string, label: string): GlobalStepAudit {
  return new GlobalStepAudit(code, label, "", 0, "", 0, 0, 0, "planned");
}
