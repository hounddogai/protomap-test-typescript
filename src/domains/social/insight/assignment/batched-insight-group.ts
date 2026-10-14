import * as text from "../../../../kit/text.js";

/** Where a batched insight group is in its life cycle. */
export type BatchedInsightGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched insight group. Its code is unique within a tenant. */
export class BatchedInsightGroup {
  code: string;
  label: string;
  minimum: number;
  utmSource: string;
  sequence: number;
  active: boolean;
  batchSize: number;
  status: BatchedInsightGroupStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    utmSource: string,
    sequence: number,
    active: boolean,
    batchSize: number,
    status: BatchedInsightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.utmSource = utmSource;
    this.sequence = sequence;
    this.active = active;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedInsightGroupStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedInsightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched insight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedVolume(): number {
    return Math.round(this.batchSize * this.sequence * 100) / 100;
  }

  copy(): BatchedInsightGroup {
    return new BatchedInsightGroup(
      this.code,
      this.label,
      this.minimum,
      this.utmSource,
      this.sequence,
      this.active,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a batched insight group in status open. */
export function newBatchedInsightGroup(code: string, label: string): BatchedInsightGroup {
  return new BatchedInsightGroup(code, label, 0, "", 0, false, 0, "open");
}
