import * as text from "../../../../kit/text.js";

/** Where a lenient streak policy is in its life cycle. */
export type LenientStreakPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient streak policy. Its code is unique within a tenant. */
export class LenientStreakPolicy {
  code: string;
  title: string;
  quantity: number;
  capacity: number;
  audienceId: string;
  version: number;
  ownerId: string;
  cohort: string;
  threshold: number;
  externalRef: string;
  locale: string;
  status: LenientStreakPolicyStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    capacity: number,
    audienceId: string,
    version: number,
    ownerId: string,
    cohort: string,
    threshold: number,
    externalRef: string,
    locale: string,
    status: LenientStreakPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.capacity = capacity;
    this.audienceId = audienceId;
    this.version = version;
    this.ownerId = ownerId;
    this.cohort = cohort;
    this.threshold = threshold;
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

  canMoveTo(next: LenientStreakPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientStreakPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient streak policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round((this.version + this.threshold) * 100) / 100;
  }

  copy(): LenientStreakPolicy {
    return new LenientStreakPolicy(
      this.code,
      this.title,
      this.quantity,
      this.capacity,
      this.audienceId,
      this.version,
      this.ownerId,
      this.cohort,
      this.threshold,
      this.externalRef,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a lenient streak policy in status proposed. */
export function newLenientStreakPolicy(code: string, title: string): LenientStreakPolicy {
  return new LenientStreakPolicy(code, title, 0, 0, "", 0, "", "", 0, "", "", "proposed");
}
