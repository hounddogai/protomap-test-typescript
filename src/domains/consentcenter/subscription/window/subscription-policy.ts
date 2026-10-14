import * as text from "../../../../kit/text.js";

/** Where a subscription policy is in its life cycle. */
export type SubscriptionPolicyStatus = "created" | "validated" | "published" | "retired";

/** A subscription policy. Its code is unique within a tenant. */
export class SubscriptionPolicy {
  code: string;
  label: string;
  contactEmail: string;
  title: string;
  cohort: string;
  quantity: number;
  pinned: boolean;
  status: SubscriptionPolicyStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    title: string,
    cohort: string,
    quantity: number,
    pinned: boolean,
    status: SubscriptionPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.title = title;
    this.cohort = cohort;
    this.quantity = quantity;
    this.pinned = pinned;
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

  canMoveTo(next: SubscriptionPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SubscriptionPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): SubscriptionPolicy {
    return new SubscriptionPolicy(
      this.code,
      this.label,
      this.contactEmail,
      this.title,
      this.cohort,
      this.quantity,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a subscription policy in status created. */
export function newSubscriptionPolicy(code: string, label: string): SubscriptionPolicy {
  return new SubscriptionPolicy(code, label, "", "", "", 0, false, "created");
}
