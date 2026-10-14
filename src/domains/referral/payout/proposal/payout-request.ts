import * as text from "../../../../kit/text.js";

/** Where a payout request is in its life cycle. */
export type PayoutRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A payout request as the payout team keeps it. */
export class PayoutRequest {
  code: string;
  name: string;
  contactEmail: string;
  currency: string;
  active: boolean;
  score: number;
  status: PayoutRequestStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    currency: string,
    active: boolean,
    score: number,
    status: PayoutRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.currency = currency;
    this.active = active;
    this.score = score;
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

  canMoveTo(next: PayoutRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PayoutRequest {
    return new PayoutRequest(
      this.code,
      this.name,
      this.contactEmail,
      this.currency,
      this.active,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout request in status draft. */
export function newPayoutRequest(code: string, name: string): PayoutRequest {
  return new PayoutRequest(code, name, "", "", false, 0, "draft");
}
