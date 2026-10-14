import * as text from "../../../../kit/text.js";

/** Where a frequency target is in its life cycle. */
export type FrequencyTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a frequency target and its current status. */
export class FrequencyTarget {
  code: string;
  name: string;
  maximum: number;
  archived: boolean;
  limit: number;
  source: string;
  conversionRate: number;
  locale: string;
  threshold: number;
  createdAt: number;
  durationMinutes: number;
  status: FrequencyTargetStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    archived: boolean,
    limit: number,
    source: string,
    conversionRate: number,
    locale: string,
    threshold: number,
    createdAt: number,
    durationMinutes: number,
    status: FrequencyTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.archived = archived;
    this.limit = limit;
    this.source = source;
    this.conversionRate = conversionRate;
    this.locale = locale;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: FrequencyTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"frequency target"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.durationMinutes + this.conversionRate) * 100) / 100;
  }

  copy(): FrequencyTarget {
    return new FrequencyTarget(
      this.code,
      this.name,
      this.maximum,
      this.archived,
      this.limit,
      this.source,
      this.conversionRate,
      this.locale,
      this.threshold,
      this.createdAt,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a frequency target in status new. */
export function newFrequencyTarget(code: string, name: string): FrequencyTarget {
  return new FrequencyTarget(code, name, 0, false, 0, "", 0, "", 0, 0, 0, "new");
}
