import * as text from "../../../../kit/text.js";

/** Where a scheduled subscription override is in its life cycle. */
export type ScheduledSubscriptionOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a scheduled subscription override and its current status. */
export class ScheduledSubscriptionOverride {
  code: string;
  label: string;
  approved: boolean;
  contactEmail: string;
  maximum: number;
  graceDays: number;
  budget: number;
  audienceId: string;
  title: string;
  amount: number;
  updatedAt: number;
  status: ScheduledSubscriptionOverrideStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    contactEmail: string,
    maximum: number,
    graceDays: number,
    budget: number,
    audienceId: string,
    title: string,
    amount: number,
    updatedAt: number,
    status: ScheduledSubscriptionOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.contactEmail = contactEmail;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.budget = budget;
    this.audienceId = audienceId;
    this.title = title;
    this.amount = amount;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: ScheduledSubscriptionOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: ScheduledSubscriptionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled subscription override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.maximum * this.amount * 100) / 100;
  }

  copy(): ScheduledSubscriptionOverride {
    return new ScheduledSubscriptionOverride(
      this.code,
      this.label,
      this.approved,
      this.contactEmail,
      this.maximum,
      this.graceDays,
      this.budget,
      this.audienceId,
      this.title,
      this.amount,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled subscription override in status proposed. */
export function newScheduledSubscriptionOverride(code: string, label: string): ScheduledSubscriptionOverride {
  return new ScheduledSubscriptionOverride(code, label, false, "", 0, 0, 0, "", "", 0, 0, "proposed");
}
