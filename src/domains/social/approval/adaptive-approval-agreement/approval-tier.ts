import * as text from "../../../../kit/text.js";

/** Where a approval tier is in its life cycle. */
export type ApprovalTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One approval tier, with what the planners need to act on it. */
export class ApprovalTier {
  code: string;
  title: string;
  durationMinutes: number;
  discount: number;
  cohort: string;
  batchSize: number;
  source: string;
  status: ApprovalTierStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    discount: number,
    cohort: string,
    batchSize: number,
    source: string,
    status: ApprovalTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.source = source;
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

  canMoveTo(next: ApprovalTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ApprovalTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"approval tier"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.discount - this.durationMinutes) * 100) / 100;
  }

  copy(): ApprovalTier {
    return new ApprovalTier(
      this.code,
      this.title,
      this.durationMinutes,
      this.discount,
      this.cohort,
      this.batchSize,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a approval tier in status idle. */
export function newApprovalTier(code: string, title: string): ApprovalTier {
  return new ApprovalTier(code, title, 0, 0, "", 0, "", "idle");
}
