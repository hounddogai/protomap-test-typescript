import * as text from "../../../../kit/text.js";

/** Where a lenient level profile is in its life cycle. */
export type LenientLevelProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a lenient level profile and its current status. */
export class LenientLevelProfile {
  code: string;
  name: string;
  reviewer: string;
  segment: string;
  unit: string;
  quantity: number;
  status: LenientLevelProfileStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    segment: string,
    unit: string,
    quantity: number,
    status: LenientLevelProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.segment = segment;
    this.unit = unit;
    this.quantity = quantity;
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

  canMoveTo(next: LenientLevelProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientLevelProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient level profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LenientLevelProfile {
    return new LenientLevelProfile(
      this.code,
      this.name,
      this.reviewer,
      this.segment,
      this.unit,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient level profile in status new. */
export function newLenientLevelProfile(code: string, name: string): LenientLevelProfile {
  return new LenientLevelProfile(code, name, "", "", "", 0, "new");
}
