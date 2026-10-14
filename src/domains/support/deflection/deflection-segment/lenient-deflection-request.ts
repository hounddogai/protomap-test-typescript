import * as text from "../../../../kit/text.js";

/** Where a lenient deflection request is in its life cycle. */
export type LenientDeflectionRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient deflection request as the deflection team keeps it. */
export class LenientDeflectionRequest {
  code: string;
  label: string;
  budget: number;
  rate: number;
  utmSource: string;
  segment: string;
  amount: number;
  notes: string;
  status: LenientDeflectionRequestStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    rate: number,
    utmSource: string,
    segment: string,
    amount: number,
    notes: string,
    status: LenientDeflectionRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.rate = rate;
    this.utmSource = utmSource;
    this.segment = segment;
    this.amount = amount;
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

  canMoveTo(next: LenientDeflectionRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientDeflectionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget - this.amount) * 100) / 100;
  }

  copy(): LenientDeflectionRequest {
    return new LenientDeflectionRequest(
      this.code,
      this.label,
      this.budget,
      this.rate,
      this.utmSource,
      this.segment,
      this.amount,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient deflection request in status requested. */
export function newLenientDeflectionRequest(code: string, label: string): LenientDeflectionRequest {
  return new LenientDeflectionRequest(code, label, 0, 0, "", "", 0, "", "requested");
}
