import * as text from "../../../../kit/text.js";

/** Where a reward exception is in its life cycle. */
export type RewardExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reward exception. Its code is unique within a tenant. */
export class RewardException {
  code: string;
  label: string;
  phone: string;
  name: string;
  budget: number;
  startsAt: number;
  contactEmail: string;
  description: string;
  status: RewardExceptionStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    name: string,
    budget: number,
    startsAt: number,
    contactEmail: string,
    description: string,
    status: RewardExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.name = name;
    this.budget = budget;
    this.startsAt = startsAt;
    this.contactEmail = contactEmail;
    this.description = description;
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

  canMoveTo(next: RewardExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RewardExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget + this.startsAt) * 100) / 100;
  }

  copy(): RewardException {
    return new RewardException(
      this.code,
      this.label,
      this.phone,
      this.name,
      this.budget,
      this.startsAt,
      this.contactEmail,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward exception in status proposed. */
export function newRewardException(code: string, label: string): RewardException {
  return new RewardException(code, label, "", "", 0, 0, "", "", "proposed");
}
