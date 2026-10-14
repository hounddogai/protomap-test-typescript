import * as text from "../../../../kit/text.js";

/** Where a regional cohort claim is in its life cycle. */
export type RegionalCohortClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One regional cohort claim, with what the planners need to act on it. */
export class RegionalCohortClaim {
  code: string;
  title: string;
  discount: number;
  openRate: number;
  amount: number;
  phone: string;
  bid: number;
  contactEmail: string;
  createdAt: number;
  channel: string;
  sendAt: number;
  status: RegionalCohortClaimStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    openRate: number,
    amount: number,
    phone: string,
    bid: number,
    contactEmail: string,
    createdAt: number,
    channel: string,
    sendAt: number,
    status: RegionalCohortClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.openRate = openRate;
    this.amount = amount;
    this.phone = phone;
    this.bid = bid;
    this.contactEmail = contactEmail;
    this.createdAt = createdAt;
    this.channel = channel;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalCohortClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalCohortClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional cohort claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round(this.sendAt * this.discount * 100) / 100;
  }

  copy(): RegionalCohortClaim {
    return new RegionalCohortClaim(
      this.code,
      this.title,
      this.discount,
      this.openRate,
      this.amount,
      this.phone,
      this.bid,
      this.contactEmail,
      this.createdAt,
      this.channel,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional cohort claim in status open. */
export function newRegionalCohortClaim(code: string, title: string): RegionalCohortClaim {
  return new RegionalCohortClaim(code, title, 0, 0, 0, "", 0, "", 0, "", 0, "open");
}
