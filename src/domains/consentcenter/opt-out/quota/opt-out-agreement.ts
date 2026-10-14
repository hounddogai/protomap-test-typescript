import * as text from "../../../../kit/text.js";

/** Where a opt out agreement is in its life cycle. */
export type OptOutAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A opt out agreement. Its code is unique within a tenant. */
export class OptOutAgreement {
  code: string;
  name: string;
  source: string;
  graceDays: number;
  campaignRef: string;
  quantity: number;
  openRate: number;
  bid: number;
  windowDays: number;
  summary: string;
  status: OptOutAgreementStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    graceDays: number,
    campaignRef: string,
    quantity: number,
    openRate: number,
    bid: number,
    windowDays: number,
    summary: string,
    status: OptOutAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.openRate = openRate;
    this.bid = bid;
    this.windowDays = windowDays;
    this.summary = summary;
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

  canMoveTo(next: OptOutAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.bid * this.quantity * 100) / 100;
  }

  copy(): OptOutAgreement {
    return new OptOutAgreement(
      this.code,
      this.name,
      this.source,
      this.graceDays,
      this.campaignRef,
      this.quantity,
      this.openRate,
      this.bid,
      this.windowDays,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a opt out agreement in status draft. */
export function newOptOutAgreement(code: string, name: string): OptOutAgreement {
  return new OptOutAgreement(code, name, "", 0, "", 0, 0, 0, 0, "", "draft");
}
