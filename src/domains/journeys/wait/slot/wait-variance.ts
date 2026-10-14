import * as text from "../../../../kit/text.js";

/** Where a wait variance is in its life cycle. */
export type WaitVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a wait variance and its current status. */
export class WaitVariance {
  code: string;
  title: string;
  margin: number;
  durationMinutes: number;
  conversionRate: number;
  createdAt: number;
  timezone: string;
  status: WaitVarianceStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    durationMinutes: number,
    conversionRate: number,
    createdAt: number,
    timezone: string,
    status: WaitVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.timezone = timezone;
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

  canMoveTo(next: WaitVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WaitVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round((this.margin - this.conversionRate) * 100) / 100;
  }

  copy(): WaitVariance {
    return new WaitVariance(
      this.code,
      this.title,
      this.margin,
      this.durationMinutes,
      this.conversionRate,
      this.createdAt,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a wait variance in status new. */
export function newWaitVariance(code: string, title: string): WaitVariance {
  return new WaitVariance(code, title, 0, 0, 0, 0, "", "new");
}
