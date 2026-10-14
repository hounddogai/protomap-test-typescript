import * as text from "../../../../kit/text.js";

/** Where a seasonal approval batch is in its life cycle. */
export type SeasonalApprovalBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal approval batch, with what the planners need to act on it. */
export class SeasonalApprovalBatch {
  code: string;
  title: string;
  utmSource: string;
  updatedAt: number;
  ownerId: string;
  ceiling: number;
  channel: string;
  cohort: string;
  attempts: number;
  unit: string;
  status: SeasonalApprovalBatchStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    updatedAt: number,
    ownerId: string,
    ceiling: number,
    channel: string,
    cohort: string,
    attempts: number,
    unit: string,
    status: SeasonalApprovalBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.ceiling = ceiling;
    this.channel = channel;
    this.cohort = cohort;
    this.attempts = attempts;
    this.unit = unit;
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

  canMoveTo(next: SeasonalApprovalBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalApprovalBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal approval batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.ceiling * this.updatedAt * 100) / 100;
  }

  copy(): SeasonalApprovalBatch {
    return new SeasonalApprovalBatch(
      this.code,
      this.title,
      this.utmSource,
      this.updatedAt,
      this.ownerId,
      this.ceiling,
      this.channel,
      this.cohort,
      this.attempts,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal approval batch in status idle. */
export function newSeasonalApprovalBatch(code: string, title: string): SeasonalApprovalBatch {
  return new SeasonalApprovalBatch(code, title, "", 0, "", 0, "", "", 0, "", "idle");
}
