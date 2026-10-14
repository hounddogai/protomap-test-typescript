import * as text from "../../../../kit/text.js";

/** Where a default insight audit is in its life cycle. */
export type DefaultInsightAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A default insight audit as the insight team keeps it. */
export class DefaultInsightAudit {
  code: string;
  title: string;
  bid: number;
  batchSize: number;
  durationMinutes: number;
  channel: string;
  cohort: string;
  status: DefaultInsightAuditStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    batchSize: number,
    durationMinutes: number,
    channel: string,
    cohort: string,
    status: DefaultInsightAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.batchSize = batchSize;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.cohort = cohort;
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

  canMoveTo(next: DefaultInsightAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultInsightAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default insight audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round(this.bid * this.durationMinutes * 100) / 100;
  }

  copy(): DefaultInsightAudit {
    return new DefaultInsightAudit(
      this.code,
      this.title,
      this.bid,
      this.batchSize,
      this.durationMinutes,
      this.channel,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default insight audit in status new. */
export function newDefaultInsightAudit(code: string, title: string): DefaultInsightAudit {
  return new DefaultInsightAudit(code, title, 0, 0, 0, "", "", "new");
}
