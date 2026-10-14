import * as text from "../../../../kit/text.js";

/** Where a fallback post record is in its life cycle. */
export type FallbackPostRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback post record. Its code is unique within a tenant. */
export class FallbackPostRecord {
  code: string;
  label: string;
  ratio: number;
  journeyId: string;
  segment: string;
  capacity: number;
  currency: string;
  externalRef: string;
  limit: number;
  status: FallbackPostRecordStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    journeyId: string,
    segment: string,
    capacity: number,
    currency: string,
    externalRef: string,
    limit: number,
    status: FallbackPostRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.segment = segment;
    this.capacity = capacity;
    this.currency = currency;
    this.externalRef = externalRef;
    this.limit = limit;
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

  canMoveTo(next: FallbackPostRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPostRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback post record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.ratio * this.capacity * 100) / 100;
  }

  copy(): FallbackPostRecord {
    return new FallbackPostRecord(
      this.code,
      this.label,
      this.ratio,
      this.journeyId,
      this.segment,
      this.capacity,
      this.currency,
      this.externalRef,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback post record in status new. */
export function newFallbackPostRecord(code: string, label: string): FallbackPostRecord {
  return new FallbackPostRecord(code, label, 0, "", "", 0, "", "", 0, "new");
}
