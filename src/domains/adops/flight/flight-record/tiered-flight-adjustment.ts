import * as text from "../../../../kit/text.js";

/** Where a tiered flight adjustment is in its life cycle. */
export type TieredFlightAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** One tiered flight adjustment, with what the planners need to act on it. */
export class TieredFlightAdjustment {
  code: string;
  title: string;
  archived: boolean;
  conversionRate: number;
  windowDays: number;
  reviewer: string;
  checksum: string;
  threshold: number;
  version: number;
  status: TieredFlightAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    conversionRate: number,
    windowDays: number,
    reviewer: string,
    checksum: string,
    threshold: number,
    version: number,
    status: TieredFlightAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.conversionRate = conversionRate;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.threshold = threshold;
    this.version = version;
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

  canMoveTo(next: TieredFlightAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredFlightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered flight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedExposure(): number {
    return Math.round((this.version + this.threshold) * 100) / 100;
  }

  copy(): TieredFlightAdjustment {
    return new TieredFlightAdjustment(
      this.code,
      this.title,
      this.archived,
      this.conversionRate,
      this.windowDays,
      this.reviewer,
      this.checksum,
      this.threshold,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered flight adjustment in status created. */
export function newTieredFlightAdjustment(code: string, title: string): TieredFlightAdjustment {
  return new TieredFlightAdjustment(code, title, false, 0, 0, "", "", 0, 0, "created");
}
