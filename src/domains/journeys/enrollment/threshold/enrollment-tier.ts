import * as text from "../../../../kit/text.js";

/** Where a enrollment tier is in its life cycle. */
export type EnrollmentTierStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A enrollment tier as the enrollment team keeps it. */
export class EnrollmentTier {
  code: string;
  title: string;
  openRate: number;
  externalRef: string;
  locale: string;
  status: EnrollmentTierStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    externalRef: string,
    locale: string,
    status: EnrollmentTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.locale = locale;
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

  canMoveTo(next: EnrollmentTierStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: EnrollmentTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment tier"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): EnrollmentTier {
    return new EnrollmentTier(this.code, this.title, this.openRate, this.externalRef, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment tier in status proposed. */
export function newEnrollmentTier(code: string, title: string): EnrollmentTier {
  return new EnrollmentTier(code, title, 0, "", "", "proposed");
}
