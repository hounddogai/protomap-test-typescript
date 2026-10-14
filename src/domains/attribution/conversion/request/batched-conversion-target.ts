import * as text from "../../../../kit/text.js";

/** Where a batched conversion target is in its life cycle. */
export type BatchedConversionTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a batched conversion target and its current status. */
export class BatchedConversionTarget {
  code: string;
  name: string;
  locale: string;
  ratio: number;
  notes: string;
  status: BatchedConversionTargetStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    ratio: number,
    notes: string,
    status: BatchedConversionTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.ratio = ratio;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedConversionTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedConversionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched conversion target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): BatchedConversionTarget {
    return new BatchedConversionTarget(this.code, this.name, this.locale, this.ratio, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched conversion target in status requested. */
export function newBatchedConversionTarget(code: string, name: string): BatchedConversionTarget {
  return new BatchedConversionTarget(code, name, "", 0, "", "requested");
}
