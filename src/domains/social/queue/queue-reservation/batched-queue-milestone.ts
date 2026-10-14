import * as text from "../../../../kit/text.js";

/** Where a batched queue milestone is in its life cycle. */
export type BatchedQueueMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A batched queue milestone as the queue team keeps it. */
export class BatchedQueueMilestone {
  code: string;
  label: string;
  version: number;
  createdAt: number;
  locale: string;
  utmSource: string;
  score: number;
  limit: number;
  phone: string;
  status: BatchedQueueMilestoneStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    createdAt: number,
    locale: string,
    utmSource: string,
    score: number,
    limit: number,
    phone: string,
    status: BatchedQueueMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.createdAt = createdAt;
    this.locale = locale;
    this.utmSource = utmSource;
    this.score = score;
    this.limit = limit;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedQueueMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedQueueMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched queue milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"batched queue milestone"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.score - this.createdAt) * 100) / 100;
  }

  copy(): BatchedQueueMilestone {
    return new BatchedQueueMilestone(
      this.code,
      this.label,
      this.version,
      this.createdAt,
      this.locale,
      this.utmSource,
      this.score,
      this.limit,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched queue milestone in status draft. */
export function newBatchedQueueMilestone(code: string, label: string): BatchedQueueMilestone {
  return new BatchedQueueMilestone(code, label, 0, 0, "", "", 0, 0, "", "draft");
}
