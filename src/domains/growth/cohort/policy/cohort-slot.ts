import * as text from "../../../../kit/text.js";

/** Where a cohort slot is in its life cycle. */
export type CohortSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One cohort slot, with what the planners need to act on it. */
export class CohortSlot {
  code: string;
  label: string;
  cost: number;
  country: string;
  unit: string;
  batchSize: number;
  limit: number;
  updatedAt: number;
  ownerId: string;
  status: CohortSlotStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    country: string,
    unit: string,
    batchSize: number,
    limit: number,
    updatedAt: number,
    ownerId: string,
    status: CohortSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.country = country;
    this.unit = unit;
    this.batchSize = batchSize;
    this.limit = limit;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
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

  canMoveTo(next: CohortSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CohortSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.limit - this.updatedAt) * 100) / 100;
  }

  copy(): CohortSlot {
    return new CohortSlot(
      this.code,
      this.label,
      this.cost,
      this.country,
      this.unit,
      this.batchSize,
      this.limit,
      this.updatedAt,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a cohort slot in status new. */
export function newCohortSlot(code: string, label: string): CohortSlot {
  return new CohortSlot(code, label, 0, "", "", 0, 0, 0, "", "new");
}
