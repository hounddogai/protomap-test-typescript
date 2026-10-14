/**
 * The post quota records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post quota is in its life cycle. */
export type PostQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A post quota. Its code is unique within a tenant. */
export class PostQuota {
  code: string;
  label: string;
  campaignRef: string;
  currency: string;
  phone: string;
  amount: number;
  status: PostQuotaStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    currency: string,
    phone: string,
    amount: number,
    status: PostQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.currency = currency;
    this.phone = phone;
    this.amount = amount;
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

  canMoveTo(next: PostQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): PostQuota {
    return new PostQuota(this.code, this.label, this.campaignRef, this.currency, this.phone, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post quota in status draft. */
export function newPostQuota(code: string, label: string): PostQuota {
  return new PostQuota(code, label, "", "", "", 0, "draft");
}
