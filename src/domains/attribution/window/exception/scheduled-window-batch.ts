import * as text from "../../../../kit/text.js";

/** Where a scheduled window batch is in its life cycle. */
export type ScheduledWindowBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled window batch, with what the planners need to act on it. */
export class ScheduledWindowBatch {
  code: string;
  label: string;
  score: number;
  externalRef: string;
  unit: string;
  status: ScheduledWindowBatchStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    externalRef: string,
    unit: string,
    status: ScheduledWindowBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.externalRef = externalRef;
    this.unit = unit;
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

  canMoveTo(next: ScheduledWindowBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWindowBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled window batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledWindowBatch {
    return new ScheduledWindowBatch(this.code, this.label, this.score, this.externalRef, this.unit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled window batch in status requested. */
export function newScheduledWindowBatch(code: string, label: string): ScheduledWindowBatch {
  return new ScheduledWindowBatch(code, label, 0, "", "", "requested");
}
