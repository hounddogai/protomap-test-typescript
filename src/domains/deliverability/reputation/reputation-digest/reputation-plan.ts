import * as text from "../../../../kit/text.js";

/** Where a reputation plan is in its life cycle. */
export type ReputationPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A reputation plan as the reputation team keeps it. */
export class ReputationPlan {
  code: string;
  title: string;
  country: string;
  contactEmail: string;
  externalRef: string;
  amount: number;
  status: ReputationPlanStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    contactEmail: string,
    externalRef: string,
    amount: number,
    status: ReputationPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"reputation plan"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): ReputationPlan {
    return new ReputationPlan(
      this.code,
      this.title,
      this.country,
      this.contactEmail,
      this.externalRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a reputation plan in status idle. */
export function newReputationPlan(code: string, title: string): ReputationPlan {
  return new ReputationPlan(code, title, "", "", "", 0, "idle");
}
