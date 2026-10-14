import * as text from "../../../../kit/text.js";

/** Where a lenient conversion baseline is in its life cycle. */
export type LenientConversionBaselineStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One lenient conversion baseline, with what the planners need to act on it. */
export class LenientConversionBaseline {
  code: string;
  label: string;
  amount: number;
  frequencyCap: number;
  active: boolean;
  revision: number;
  discount: number;
  status: LenientConversionBaselineStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    frequencyCap: number,
    active: boolean,
    revision: number,
    discount: number,
    status: LenientConversionBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.revision = revision;
    this.discount = discount;
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

  canMoveTo(next: LenientConversionBaselineStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientConversionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient conversion baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"lenient conversion baseline"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.revision - this.amount) * 100) / 100;
  }

  copy(): LenientConversionBaseline {
    return new LenientConversionBaseline(
      this.code,
      this.label,
      this.amount,
      this.frequencyCap,
      this.active,
      this.revision,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient conversion baseline in status open. */
export function newLenientConversionBaseline(code: string, label: string): LenientConversionBaseline {
  return new LenientConversionBaseline(code, label, 0, 0, false, 0, 0, "open");
}
