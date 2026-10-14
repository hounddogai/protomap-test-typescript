import * as text from "../../../../kit/text.js";

/** Where a manual step record is in its life cycle. */
export type ManualStepRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a manual step record and its current status. */
export class ManualStepRecord {
  code: string;
  name: string;
  locale: string;
  maximum: number;
  sequence: number;
  minimum: number;
  status: ManualStepRecordStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    maximum: number,
    sequence: number,
    minimum: number,
    status: ManualStepRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.maximum = maximum;
    this.sequence = sequence;
    this.minimum = minimum;
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

  canMoveTo(next: ManualStepRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualStepRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual step record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum + this.minimum) * 100) / 100;
  }

  copy(): ManualStepRecord {
    return new ManualStepRecord(
      this.code,
      this.name,
      this.locale,
      this.maximum,
      this.sequence,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual step record in status new. */
export function newManualStepRecord(code: string, name: string): ManualStepRecord {
  return new ManualStepRecord(code, name, "", 0, 0, 0, "new");
}
