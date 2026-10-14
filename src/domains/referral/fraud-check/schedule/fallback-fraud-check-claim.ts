import * as text from "../../../../kit/text.js";

/** Where a fallback fraud check claim is in its life cycle. */
export type FallbackFraudCheckClaimStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback fraud check claim and its current status. */
export class FallbackFraudCheckClaim {
  code: string;
  title: string;
  ownerId: string;
  budget: number;
  locale: string;
  status: FallbackFraudCheckClaimStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    budget: number,
    locale: string,
    status: FallbackFraudCheckClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.budget = budget;
    this.locale = locale;
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

  canMoveTo(next: FallbackFraudCheckClaimStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackFraudCheckClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback fraud check claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): FallbackFraudCheckClaim {
    return new FallbackFraudCheckClaim(this.code, this.title, this.ownerId, this.budget, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback fraud check claim in status requested. */
export function newFallbackFraudCheckClaim(code: string, title: string): FallbackFraudCheckClaim {
  return new FallbackFraudCheckClaim(code, title, "", 0, "", "requested");
}
