import * as text from "../../../../kit/text.js";

/** Where a global macro digest is in its life cycle. */
export type GlobalMacroDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a global macro digest and its current status. */
export class GlobalMacroDigest {
  code: string;
  name: string;
  unit: string;
  cohort: string;
  visible: boolean;
  amount: number;
  status: GlobalMacroDigestStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    cohort: string,
    visible: boolean,
    amount: number,
    status: GlobalMacroDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.cohort = cohort;
    this.visible = visible;
    this.amount = amount;
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

  canMoveTo(next: GlobalMacroDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalMacroDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global macro digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global macro digest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): GlobalMacroDigest {
    return new GlobalMacroDigest(this.code, this.name, this.unit, this.cohort, this.visible, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global macro digest in status open. */
export function newGlobalMacroDigest(code: string, name: string): GlobalMacroDigest {
  return new GlobalMacroDigest(code, name, "", "", false, 0, "open");
}
