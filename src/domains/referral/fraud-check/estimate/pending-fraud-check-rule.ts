import * as text from "../../../../kit/text.js";

/** Where a pending fraud check rule is in its life cycle. */
export type PendingFraudCheckRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a pending fraud check rule and its current status. */
export class PendingFraudCheckRule {
  code: string;
  name: string;
  tags: string[];
  unit: string;
  threshold: number;
  contactEmail: string;
  timezone: string;
  capacity: number;
  externalRef: string;
  status: PendingFraudCheckRuleStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    unit: string,
    threshold: number,
    contactEmail: string,
    timezone: string,
    capacity: number,
    externalRef: string,
    status: PendingFraudCheckRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.unit = unit;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
    this.timezone = timezone;
    this.capacity = capacity;
    this.externalRef = externalRef;
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

  canMoveTo(next: PendingFraudCheckRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
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
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingFraudCheckRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending fraud check rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending fraud check rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.capacity + this.threshold) * 100) / 100;
  }

  copy(): PendingFraudCheckRule {
    return new PendingFraudCheckRule(
      this.code,
      this.name,
      this.tags,
      this.unit,
      this.threshold,
      this.contactEmail,
      this.timezone,
      this.capacity,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending fraud check rule in status proposed. */
export function newPendingFraudCheckRule(code: string, name: string): PendingFraudCheckRule {
  return new PendingFraudCheckRule(code, name, [], "", 0, "", "", 0, "", "proposed");
}
