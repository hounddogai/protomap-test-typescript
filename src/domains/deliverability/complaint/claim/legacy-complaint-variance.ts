import * as text from "../../../../kit/text.js";

/** Where a legacy complaint variance is in its life cycle. */
export type LegacyComplaintVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy complaint variance as the complaint team keeps it. */
export class LegacyComplaintVariance {
  code: string;
  title: string;
  expiresAt: number;
  graceDays: number;
  audienceId: string;
  createdAt: number;
  capacity: number;
  status: LegacyComplaintVarianceStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    graceDays: number,
    audienceId: string,
    createdAt: number,
    capacity: number,
    status: LegacyComplaintVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.graceDays = graceDays;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.capacity = capacity;
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

  canMoveTo(next: LegacyComplaintVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyComplaintVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy complaint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"legacy complaint variance"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.createdAt + this.graceDays) * 100) / 100;
  }

  copy(): LegacyComplaintVariance {
    return new LegacyComplaintVariance(
      this.code,
      this.title,
      this.expiresAt,
      this.graceDays,
      this.audienceId,
      this.createdAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy complaint variance in status new. */
export function newLegacyComplaintVariance(code: string, title: string): LegacyComplaintVariance {
  return new LegacyComplaintVariance(code, title, 0, 0, "", 0, 0, "new");
}
