import * as text from "../../../../kit/text.js";

/** Where a capped cohort snapshot is in its life cycle. */
export type CappedCohortSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a capped cohort snapshot and its current status. */
export class CappedCohortSnapshot {
  code: string;
  title: string;
  budget: number;
  weight: number;
  attributes: Map<string, string>;
  status: CappedCohortSnapshotStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    weight: number,
    attributes: Map<string, string>,
    status: CappedCohortSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.weight = weight;
    this.attributes = attributes;
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

  canMoveTo(next: CappedCohortSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCohortSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped cohort snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped cohort snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round((this.budget + this.weight) * 100) / 100;
  }

  copy(): CappedCohortSnapshot {
    return new CappedCohortSnapshot(this.code, this.title, this.budget, this.weight, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped cohort snapshot in status new. */
export function newCappedCohortSnapshot(code: string, title: string): CappedCohortSnapshot {
  return new CappedCohortSnapshot(code, title, 0, 0, new Map<string, string>(), "new");
}
