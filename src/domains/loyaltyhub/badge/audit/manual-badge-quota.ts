import * as text from "../../../../kit/text.js";

/** Where a manual badge quota is in its life cycle. */
export type ManualBadgeQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual badge quota and its current status. */
export class ManualBadgeQuota {
  code: string;
  title: string;
  segment: string;
  amount: number;
  name: string;
  capacity: number;
  country: string;
  discount: number;
  ceiling: number;
  status: ManualBadgeQuotaStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    amount: number,
    name: string,
    capacity: number,
    country: string,
    discount: number,
    ceiling: number,
    status: ManualBadgeQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.amount = amount;
    this.name = name;
    this.capacity = capacity;
    this.country = country;
    this.discount = discount;
    this.ceiling = ceiling;
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

  canMoveTo(next: ManualBadgeQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualBadgeQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual badge quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netVolume(): number {
    return Math.round((this.amount + this.discount) * 100) / 100;
  }

  copy(): ManualBadgeQuota {
    return new ManualBadgeQuota(
      this.code,
      this.title,
      this.segment,
      this.amount,
      this.name,
      this.capacity,
      this.country,
      this.discount,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual badge quota in status requested. */
export function newManualBadgeQuota(code: string, title: string): ManualBadgeQuota {
  return new ManualBadgeQuota(code, title, "", 0, "", 0, "", 0, 0, "requested");
}
