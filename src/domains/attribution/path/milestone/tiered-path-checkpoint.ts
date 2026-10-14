import * as text from "../../../../kit/text.js";

/** Where a tiered path checkpoint is in its life cycle. */
export type TieredPathCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a tiered path checkpoint and its current status. */
export class TieredPathCheckpoint {
  code: string;
  label: string;
  batchSize: number;
  threshold: number;
  segment: string;
  openRate: number;
  status: TieredPathCheckpointStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    threshold: number,
    segment: string,
    openRate: number,
    status: TieredPathCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.segment = segment;
    this.openRate = openRate;
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

  canMoveTo(next: TieredPathCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TieredPathCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered path checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.openRate * this.batchSize * 100) / 100;
  }

  copy(): TieredPathCheckpoint {
    return new TieredPathCheckpoint(
      this.code,
      this.label,
      this.batchSize,
      this.threshold,
      this.segment,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered path checkpoint in status new. */
export function newTieredPathCheckpoint(code: string, label: string): TieredPathCheckpoint {
  return new TieredPathCheckpoint(code, label, 0, 0, "", 0, "new");
}
