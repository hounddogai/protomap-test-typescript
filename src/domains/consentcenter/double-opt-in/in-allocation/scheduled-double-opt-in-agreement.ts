import * as text from "../../../../kit/text.js";

/** Where a scheduled double opt in agreement is in its life cycle. */
export type ScheduledDoubleOptInAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A scheduled double opt in agreement. Its code is unique within a tenant. */
export class ScheduledDoubleOptInAgreement {
  code: string;
  label: string;
  tags: string[];
  frequencyCap: number;
  weight: number;
  sequence: number;
  currency: string;
  status: ScheduledDoubleOptInAgreementStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    frequencyCap: number,
    weight: number,
    sequence: number,
    currency: string,
    status: ScheduledDoubleOptInAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.sequence = sequence;
    this.currency = currency;
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

  canMoveTo(next: ScheduledDoubleOptInAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDoubleOptInAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled double opt in agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled double opt in agreement"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round(this.frequencyCap * this.sequence * 100) / 100;
  }

  copy(): ScheduledDoubleOptInAgreement {
    return new ScheduledDoubleOptInAgreement(
      this.code,
      this.label,
      this.tags,
      this.frequencyCap,
      this.weight,
      this.sequence,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled double opt in agreement in status draft. */
export function newScheduledDoubleOptInAgreement(code: string, label: string): ScheduledDoubleOptInAgreement {
  return new ScheduledDoubleOptInAgreement(code, label, [], 0, 0, 0, "", "draft");
}
