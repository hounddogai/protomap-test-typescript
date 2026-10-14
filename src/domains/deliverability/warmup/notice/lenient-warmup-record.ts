import * as text from "../../../../kit/text.js";

/** Where a lenient warmup record is in its life cycle. */
export type LenientWarmupRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a lenient warmup record and its current status. */
export class LenientWarmupRecord {
  code: string;
  title: string;
  maximum: number;
  startsAt: number;
  name: string;
  status: LenientWarmupRecordStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    startsAt: number,
    name: string,
    status: LenientWarmupRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientWarmupRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientWarmupRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient warmup record"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.maximum - this.startsAt) * 100) / 100;
  }

  copy(): LenientWarmupRecord {
    return new LenientWarmupRecord(this.code, this.title, this.maximum, this.startsAt, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient warmup record in status proposed. */
export function newLenientWarmupRecord(code: string, title: string): LenientWarmupRecord {
  return new LenientWarmupRecord(code, title, 0, 0, "", "proposed");
}
