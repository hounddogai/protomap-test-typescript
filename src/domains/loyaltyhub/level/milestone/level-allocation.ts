import * as text from "../../../../kit/text.js";

/** Where a level allocation is in its life cycle. */
export type LevelAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A level allocation as the level team keeps it. */
export class LevelAllocation {
  code: string;
  title: string;
  region: string;
  createdAt: number;
  externalRef: string;
  weight: number;
  sequence: number;
  updatedAt: number;
  ceiling: number;
  budget: number;
  retries: number;
  status: LevelAllocationStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    createdAt: number,
    externalRef: string,
    weight: number,
    sequence: number,
    updatedAt: number,
    ceiling: number,
    budget: number,
    retries: number,
    status: LevelAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.createdAt = createdAt;
    this.externalRef = externalRef;
    this.weight = weight;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.budget = budget;
    this.retries = retries;
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

  canMoveTo(next: LevelAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LevelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"level allocation"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.sequence + this.updatedAt) * 100) / 100;
  }

  copy(): LevelAllocation {
    return new LevelAllocation(
      this.code,
      this.title,
      this.region,
      this.createdAt,
      this.externalRef,
      this.weight,
      this.sequence,
      this.updatedAt,
      this.ceiling,
      this.budget,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a level allocation in status new. */
export function newLevelAllocation(code: string, title: string): LevelAllocation {
  return new LevelAllocation(code, title, "", 0, "", 0, 0, 0, 0, 0, 0, "new");
}
