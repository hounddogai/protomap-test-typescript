import * as text from "../../../../kit/text.js";

/** Where a reputation assignment is in its life cycle. */
export type ReputationAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A reputation assignment as the reputation team keeps it. */
export class ReputationAssignment {
  code: string;
  title: string;
  locale: string;
  currency: string;
  bid: number;
  timezone: string;
  active: boolean;
  status: ReputationAssignmentStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    currency: string,
    bid: number,
    timezone: string,
    active: boolean,
    status: ReputationAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.currency = currency;
    this.bid = bid;
    this.timezone = timezone;
    this.active = active;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): ReputationAssignment {
    return new ReputationAssignment(
      this.code,
      this.title,
      this.locale,
      this.currency,
      this.bid,
      this.timezone,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reputation assignment in status requested. */
export function newReputationAssignment(code: string, title: string): ReputationAssignment {
  return new ReputationAssignment(code, title, "", "", 0, "", false, "requested");
}
