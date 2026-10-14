import * as text from "../../../../kit/text.js";

/** Where a scheduled insight threshold is in its life cycle. */
export type ScheduledInsightThresholdStatus = "created" | "validated" | "published" | "retired";

/** A scheduled insight threshold as the insight team keeps it. */
export class ScheduledInsightThreshold {
  code: string;
  name: string;
  createdAt: number;
  durationMinutes: number;
  minimum: number;
  status: ScheduledInsightThresholdStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    durationMinutes: number,
    minimum: number,
    status: ScheduledInsightThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
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

  canMoveTo(next: ScheduledInsightThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ScheduledInsightThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled insight threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round(this.minimum * this.durationMinutes * 100) / 100;
  }

  copy(): ScheduledInsightThreshold {
    return new ScheduledInsightThreshold(
      this.code,
      this.name,
      this.createdAt,
      this.durationMinutes,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled insight threshold in status created. */
export function newScheduledInsightThreshold(code: string, name: string): ScheduledInsightThreshold {
  return new ScheduledInsightThreshold(code, name, 0, 0, 0, "created");
}
