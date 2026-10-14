import * as text from "../../../../kit/text.js";

/** Where a frequency allocation is in its life cycle. */
export type FrequencyAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a frequency allocation and its current status. */
export class FrequencyAllocation {
  code: string;
  label: string;
  segment: string;
  score: number;
  priority: number;
  minimum: number;
  limit: number;
  journeyId: string;
  locale: string;
  status: FrequencyAllocationStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    score: number,
    priority: number,
    minimum: number,
    limit: number,
    journeyId: string,
    locale: string,
    status: FrequencyAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.score = score;
    this.priority = priority;
    this.minimum = minimum;
    this.limit = limit;
    this.journeyId = journeyId;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FrequencyAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round(this.priority * this.score * 100) / 100;
  }

  copy(): FrequencyAllocation {
    return new FrequencyAllocation(
      this.code,
      this.label,
      this.segment,
      this.score,
      this.priority,
      this.minimum,
      this.limit,
      this.journeyId,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a frequency allocation in status planned. */
export function newFrequencyAllocation(code: string, label: string): FrequencyAllocation {
  return new FrequencyAllocation(code, label, "", 0, 0, 0, 0, "", "", "planned");
}
