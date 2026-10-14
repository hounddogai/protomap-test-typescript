import * as text from "../../../../kit/text.js";

/** Where a pacing checkpoint is in its life cycle. */
export type PacingCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pacing checkpoint. Its code is unique within a tenant. */
export class PacingCheckpoint {
  code: string;
  name: string;
  bid: number;
  conversionRate: number;
  capacity: number;
  attributes: Map<string, string>;
  batchSize: number;
  budget: number;
  variant: string;
  label: string;
  cohort: string;
  status: PacingCheckpointStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    conversionRate: number,
    capacity: number,
    attributes: Map<string, string>,
    batchSize: number,
    budget: number,
    variant: string,
    label: string,
    cohort: string,
    status: PacingCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.conversionRate = conversionRate;
    this.capacity = capacity;
    this.attributes = attributes;
    this.batchSize = batchSize;
    this.budget = budget;
    this.variant = variant;
    this.label = label;
    this.cohort = cohort;
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

  canMoveTo(next: PacingCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: PacingCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pacing checkpoint"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.bid - this.conversionRate) * 100) / 100;
  }

  copy(): PacingCheckpoint {
    return new PacingCheckpoint(
      this.code,
      this.name,
      this.bid,
      this.conversionRate,
      this.capacity,
      this.attributes,
      this.batchSize,
      this.budget,
      this.variant,
      this.label,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing checkpoint in status new. */
export function newPacingCheckpoint(code: string, name: string): PacingCheckpoint {
  return new PacingCheckpoint(code, name, 0, 0, 0, new Map<string, string>(), 0, 0, "", "", "", "new");
}
