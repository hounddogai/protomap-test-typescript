import * as text from "../../../../kit/text.js";

/** Where a regional sla agreement is in its life cycle. */
export type RegionalSlaAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional sla agreement. Its code is unique within a tenant. */
export class RegionalSlaAgreement {
  code: string;
  title: string;
  sendAt: number;
  contactEmail: string;
  ratio: number;
  version: number;
  bid: number;
  cost: number;
  floorValue: number;
  amount: number;
  capacity: number;
  status: RegionalSlaAgreementStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    contactEmail: string,
    ratio: number,
    version: number,
    bid: number,
    cost: number,
    floorValue: number,
    amount: number,
    capacity: number,
    status: RegionalSlaAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.version = version;
    this.bid = bid;
    this.cost = cost;
    this.floorValue = floorValue;
    this.amount = amount;
    this.capacity = capacity;
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

  canMoveTo(next: RegionalSlaAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSlaAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sla agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveValue(): number {
    return Math.round((this.floorValue - this.capacity) * 100) / 100;
  }

  copy(): RegionalSlaAgreement {
    return new RegionalSlaAgreement(
      this.code,
      this.title,
      this.sendAt,
      this.contactEmail,
      this.ratio,
      this.version,
      this.bid,
      this.cost,
      this.floorValue,
      this.amount,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional sla agreement in status open. */
export function newRegionalSlaAgreement(code: string, title: string): RegionalSlaAgreement {
  return new RegionalSlaAgreement(code, title, 0, "", 0, 0, 0, 0, 0, 0, 0, "open");
}
