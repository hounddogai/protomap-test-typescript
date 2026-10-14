import * as text from "../../../../kit/text.js";

/** Where a funnel record is in its life cycle. */
export type FunnelRecordStatus = "created" | "validated" | "published" | "retired";

/** One funnel record, with what the planners need to act on it. */
export class FunnelRecord {
  code: string;
  label: string;
  batchSize: number;
  maximum: number;
  createdAt: number;
  margin: number;
  frequencyCap: number;
  status: FunnelRecordStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    maximum: number,
    createdAt: number,
    margin: number,
    frequencyCap: number,
    status: FunnelRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.createdAt = createdAt;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedValue(): number {
    return Math.round((this.margin - this.maximum) * 100) / 100;
  }

  copy(): FunnelRecord {
    return new FunnelRecord(
      this.code,
      this.label,
      this.batchSize,
      this.maximum,
      this.createdAt,
      this.margin,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a funnel record in status created. */
export function newFunnelRecord(code: string, label: string): FunnelRecord {
  return new FunnelRecord(code, label, 0, 0, 0, 0, 0, "created");
}
