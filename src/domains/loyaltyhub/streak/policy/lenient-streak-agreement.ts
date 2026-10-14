import * as text from "../../../../kit/text.js";

/** Where a lenient streak agreement is in its life cycle. */
export type LenientStreakAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient streak agreement as the streak team keeps it. */
export class LenientStreakAgreement {
  code: string;
  label: string;
  ceiling: number;
  approved: boolean;
  sequence: number;
  name: string;
  expiresAt: number;
  ratio: number;
  utmSource: string;
  status: LenientStreakAgreementStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    approved: boolean,
    sequence: number,
    name: string,
    expiresAt: number,
    ratio: number,
    utmSource: string,
    status: LenientStreakAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.approved = approved;
    this.sequence = sequence;
    this.name = name;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.utmSource = utmSource;
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

  canMoveTo(next: LenientStreakAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientStreakAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedTotal(): number {
    return Math.round(this.ceiling * this.ratio * 100) / 100;
  }

  copy(): LenientStreakAgreement {
    return new LenientStreakAgreement(
      this.code,
      this.label,
      this.ceiling,
      this.approved,
      this.sequence,
      this.name,
      this.expiresAt,
      this.ratio,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient streak agreement in status new. */
export function newLenientStreakAgreement(code: string, label: string): LenientStreakAgreement {
  return new LenientStreakAgreement(code, label, 0, false, 0, "", 0, 0, "", "new");
}
