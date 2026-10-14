import * as text from "../../../../kit/text.js";

/** Where a pending enrollment policy is in its life cycle. */
export type PendingEnrollmentPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending enrollment policy as the enrollment team keeps it. */
export class PendingEnrollmentPolicy {
  code: string;
  title: string;
  timezone: string;
  attributes: Map<string, string>;
  label: string;
  unit: string;
  bid: number;
  ceiling: number;
  status: PendingEnrollmentPolicyStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    attributes: Map<string, string>,
    label: string,
    unit: string,
    bid: number,
    ceiling: number,
    status: PendingEnrollmentPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.attributes = attributes;
    this.label = label;
    this.unit = unit;
    this.bid = bid;
    this.ceiling = ceiling;
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

  canMoveTo(next: PendingEnrollmentPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingEnrollmentPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending enrollment policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.ceiling + this.bid) * 100) / 100;
  }

  copy(): PendingEnrollmentPolicy {
    return new PendingEnrollmentPolicy(
      this.code,
      this.title,
      this.timezone,
      this.attributes,
      this.label,
      this.unit,
      this.bid,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending enrollment policy in status open. */
export function newPendingEnrollmentPolicy(code: string, title: string): PendingEnrollmentPolicy {
  return new PendingEnrollmentPolicy(code, title, "", new Map<string, string>(), "", "", 0, 0, "open");
}
