import * as text from "../../../../kit/text.js";

/** Where a streak variance is in its life cycle. */
export type StreakVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a streak variance and its current status. */
export class StreakVariance {
  code: string;
  label: string;
  source: string;
  name: string;
  updatedAt: number;
  ownerId: string;
  segment: string;
  title: string;
  threshold: number;
  variant: string;
  region: string;
  status: StreakVarianceStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    name: string,
    updatedAt: number,
    ownerId: string,
    segment: string,
    title: string,
    threshold: number,
    variant: string,
    region: string,
    status: StreakVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.name = name;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
    this.segment = segment;
    this.title = title;
    this.threshold = threshold;
    this.variant = variant;
    this.region = region;
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

  canMoveTo(next: StreakVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"streak variance"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.updatedAt + this.threshold) * 100) / 100;
  }

  copy(): StreakVariance {
    return new StreakVariance(
      this.code,
      this.label,
      this.source,
      this.name,
      this.updatedAt,
      this.ownerId,
      this.segment,
      this.title,
      this.threshold,
      this.variant,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a streak variance in status new. */
export function newStreakVariance(code: string, label: string): StreakVariance {
  return new StreakVariance(code, label, "", "", 0, "", "", "", 0, "", "", "new");
}
