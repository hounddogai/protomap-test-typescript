import * as text from "../../../../kit/text.js";

/** Where a batched placement entry is in its life cycle. */
export type BatchedPlacementEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched placement entry. Its code is unique within a tenant. */
export class BatchedPlacementEntry {
  code: string;
  name: string;
  visible: boolean;
  cohort: string;
  country: string;
  cost: number;
  revision: number;
  status: BatchedPlacementEntryStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    cohort: string,
    country: string,
    cost: number,
    revision: number,
    status: BatchedPlacementEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.cohort = cohort;
    this.country = country;
    this.cost = cost;
    this.revision = revision;
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

  canMoveTo(next: BatchedPlacementEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedPlacementEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.revision - this.cost) * 100) / 100;
  }

  copy(): BatchedPlacementEntry {
    return new BatchedPlacementEntry(
      this.code,
      this.name,
      this.visible,
      this.cohort,
      this.country,
      this.cost,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched placement entry in status planned. */
export function newBatchedPlacementEntry(code: string, name: string): BatchedPlacementEntry {
  return new BatchedPlacementEntry(code, name, false, "", "", 0, 0, "planned");
}
