import * as text from "../../../../kit/text.js";

/** Where a seasonal double opt in batch is in its life cycle. */
export type SeasonalDoubleOptInBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal double opt in batch. Its code is unique within a tenant. */
export class SeasonalDoubleOptInBatch {
  code: string;
  label: string;
  budget: number;
  cohort: string;
  createdAt: number;
  retries: number;
  utmSource: string;
  floorValue: number;
  status: SeasonalDoubleOptInBatchStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    cohort: string,
    createdAt: number,
    retries: number,
    utmSource: string,
    floorValue: number,
    status: SeasonalDoubleOptInBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.retries = retries;
    this.utmSource = utmSource;
    this.floorValue = floorValue;
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

  canMoveTo(next: SeasonalDoubleOptInBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDoubleOptInBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal double opt in batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.floorValue + this.retries) * 100) / 100;
  }

  copy(): SeasonalDoubleOptInBatch {
    return new SeasonalDoubleOptInBatch(
      this.code,
      this.label,
      this.budget,
      this.cohort,
      this.createdAt,
      this.retries,
      this.utmSource,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal double opt in batch in status planned. */
export function newSeasonalDoubleOptInBatch(code: string, label: string): SeasonalDoubleOptInBatch {
  return new SeasonalDoubleOptInBatch(code, label, 0, "", 0, 0, "", 0, "planned");
}
