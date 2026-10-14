import * as text from "../../../../kit/text.js";

/** Where a regional payout policy is in its life cycle. */
export type RegionalPayoutPolicyStatus = "created" | "validated" | "published" | "retired";

/** A regional payout policy. Its code is unique within a tenant. */
export class RegionalPayoutPolicy {
  code: string;
  title: string;
  reviewer: string;
  contactEmail: string;
  attempts: number;
  cost: number;
  approved: boolean;
  threshold: number;
  utmSource: string;
  status: RegionalPayoutPolicyStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    contactEmail: string,
    attempts: number,
    cost: number,
    approved: boolean,
    threshold: number,
    utmSource: string,
    status: RegionalPayoutPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.attempts = attempts;
    this.cost = cost;
    this.approved = approved;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPayoutPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPayoutPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional payout policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional payout policy"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold + this.attempts) * 100) / 100;
  }

  copy(): RegionalPayoutPolicy {
    return new RegionalPayoutPolicy(
      this.code,
      this.title,
      this.reviewer,
      this.contactEmail,
      this.attempts,
      this.cost,
      this.approved,
      this.threshold,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a regional payout policy in status created. */
export function newRegionalPayoutPolicy(code: string, title: string): RegionalPayoutPolicy {
  return new RegionalPayoutPolicy(code, title, "", "", 0, 0, false, 0, "", "created");
}
