import * as text from "../../../../kit/text.js";

/** Where a lenient domain score is in its life cycle. */
export type LenientDomainScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient domain score as the domain team keeps it. */
export class LenientDomainScore {
  code: string;
  label: string;
  notes: string;
  minimum: number;
  ratio: number;
  status: LenientDomainScoreStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    minimum: number,
    ratio: number,
    status: LenientDomainScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.minimum = minimum;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientDomainScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientDomainScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient domain score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient domain score"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.minimum * this.ratio * 100) / 100;
  }

  copy(): LenientDomainScore {
    return new LenientDomainScore(this.code, this.label, this.notes, this.minimum, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient domain score in status draft. */
export function newLenientDomainScore(code: string, label: string): LenientDomainScore {
  return new LenientDomainScore(code, label, "", 0, 0, "draft");
}
