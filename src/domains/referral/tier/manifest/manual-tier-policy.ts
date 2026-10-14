import * as text from "../../../../kit/text.js";

/** Where a manual tier policy is in its life cycle. */
export type ManualTierPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual tier policy as the tier team keeps it. */
export class ManualTierPolicy {
  code: string;
  name: string;
  pinned: boolean;
  locale: string;
  cohort: string;
  approved: boolean;
  contactEmail: string;
  checksum: string;
  score: number;
  amount: number;
  status: ManualTierPolicyStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    locale: string,
    cohort: string,
    approved: boolean,
    contactEmail: string,
    checksum: string,
    score: number,
    amount: number,
    status: ManualTierPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.locale = locale;
    this.cohort = cohort;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.checksum = checksum;
    this.score = score;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualTierPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTierPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual tier policy"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.score) * 100) / 100;
  }

  copy(): ManualTierPolicy {
    return new ManualTierPolicy(
      this.code,
      this.name,
      this.pinned,
      this.locale,
      this.cohort,
      this.approved,
      this.contactEmail,
      this.checksum,
      this.score,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual tier policy in status planned. */
export function newManualTierPolicy(code: string, name: string): ManualTierPolicy {
  return new ManualTierPolicy(code, name, false, "", "", false, "", "", 0, 0, "planned");
}
