import * as text from "../../../../kit/text.js";

/** Where a strict macro target is in its life cycle. */
export type StrictMacroTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One strict macro target, with what the planners need to act on it. */
export class StrictMacroTarget {
  code: string;
  name: string;
  threshold: number;
  externalRef: string;
  frequencyCap: number;
  bid: number;
  status: StrictMacroTargetStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    externalRef: string,
    frequencyCap: number,
    bid: number,
    status: StrictMacroTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.bid = bid;
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

  canMoveTo(next: StrictMacroTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: StrictMacroTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict macro target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict macro target"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.bid + this.threshold) * 100) / 100;
  }

  copy(): StrictMacroTarget {
    return new StrictMacroTarget(
      this.code,
      this.name,
      this.threshold,
      this.externalRef,
      this.frequencyCap,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict macro target in status proposed. */
export function newStrictMacroTarget(code: string, name: string): StrictMacroTarget {
  return new StrictMacroTarget(code, name, 0, "", 0, 0, "proposed");
}
