import * as text from "../../../../kit/text.js";

/** Where a adaptive exit rule audit is in its life cycle. */
export type AdaptiveExitRuleAuditStatus = "created" | "validated" | "published" | "retired";

/** One adaptive exit rule audit, with what the planners need to act on it. */
export class AdaptiveExitRuleAudit {
  code: string;
  title: string;
  retries: number;
  batchSize: number;
  createdAt: number;
  notes: string;
  channel: string;
  maximum: number;
  approved: boolean;
  status: AdaptiveExitRuleAuditStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    batchSize: number,
    createdAt: number,
    notes: string,
    channel: string,
    maximum: number,
    approved: boolean,
    status: AdaptiveExitRuleAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.notes = notes;
    this.channel = channel;
    this.maximum = maximum;
    this.approved = approved;
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

  canMoveTo(next: AdaptiveExitRuleAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveExitRuleAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive exit rule audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.maximum * this.retries * 100) / 100;
  }

  copy(): AdaptiveExitRuleAudit {
    return new AdaptiveExitRuleAudit(
      this.code,
      this.title,
      this.retries,
      this.batchSize,
      this.createdAt,
      this.notes,
      this.channel,
      this.maximum,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive exit rule audit in status created. */
export function newAdaptiveExitRuleAudit(code: string, title: string): AdaptiveExitRuleAudit {
  return new AdaptiveExitRuleAudit(code, title, 0, 0, 0, "", "", 0, false, "created");
}
