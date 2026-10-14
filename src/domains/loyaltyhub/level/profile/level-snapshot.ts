import * as text from "../../../../kit/text.js";

/** Where a level snapshot is in its life cycle. */
export type LevelSnapshotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a level snapshot and its current status. */
export class LevelSnapshot {
  code: string;
  title: string;
  budget: number;
  discount: number;
  ratio: number;
  floorValue: number;
  segment: string;
  conversionRate: number;
  capacity: number;
  status: LevelSnapshotStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    discount: number,
    ratio: number,
    floorValue: number,
    segment: string,
    conversionRate: number,
    capacity: number,
    status: LevelSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.discount = discount;
    this.ratio = ratio;
    this.floorValue = floorValue;
    this.segment = segment;
    this.conversionRate = conversionRate;
    this.capacity = capacity;
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

  canMoveTo(next: LevelSnapshotStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LevelSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.ratio * this.floorValue * 100) / 100;
  }

  copy(): LevelSnapshot {
    return new LevelSnapshot(
      this.code,
      this.title,
      this.budget,
      this.discount,
      this.ratio,
      this.floorValue,
      this.segment,
      this.conversionRate,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a level snapshot in status new. */
export function newLevelSnapshot(code: string, title: string): LevelSnapshot {
  return new LevelSnapshot(code, title, 0, 0, 0, 0, "", 0, 0, "new");
}
