import * as text from "../../../../kit/text.js";

/** Where a insight schedule is in its life cycle. */
export type InsightScheduleStatus = "requested" | "granted" | "revoked" | "expired";

/** One insight schedule, with what the planners need to act on it. */
export class InsightSchedule {
  code: string;
  label: string;
  channel: string;
  threshold: number;
  reviewer: string;
  durationMinutes: number;
  batchSize: number;
  status: InsightScheduleStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    threshold: number,
    reviewer: string,
    durationMinutes: number,
    batchSize: number,
    status: InsightScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightScheduleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: InsightScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.durationMinutes - this.batchSize) * 100) / 100;
  }

  copy(): InsightSchedule {
    return new InsightSchedule(
      this.code,
      this.label,
      this.channel,
      this.threshold,
      this.reviewer,
      this.durationMinutes,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight schedule in status requested. */
export function newInsightSchedule(code: string, label: string): InsightSchedule {
  return new InsightSchedule(code, label, "", 0, "", 0, 0, "requested");
}
