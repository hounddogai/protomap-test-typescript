import * as text from "../../../../kit/text.js";

/** Where a subscription quota is in its life cycle. */
export type SubscriptionQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** A subscription quota as the subscription team keeps it. */
export class SubscriptionQuota {
  code: string;
  label: string;
  locale: string;
  ownerId: string;
  limit: number;
  budget: number;
  checksum: string;
  status: SubscriptionQuotaStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    ownerId: string,
    limit: number,
    budget: number,
    checksum: string,
    status: SubscriptionQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.ownerId = ownerId;
    this.limit = limit;
    this.budget = budget;
    this.checksum = checksum;
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

  canMoveTo(next: SubscriptionQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SubscriptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.budget * this.limit * 100) / 100;
  }

  copy(): SubscriptionQuota {
    return new SubscriptionQuota(
      this.code,
      this.label,
      this.locale,
      this.ownerId,
      this.limit,
      this.budget,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription quota in status requested. */
export function newSubscriptionQuota(code: string, label: string): SubscriptionQuota {
  return new SubscriptionQuota(code, label, "", "", 0, 0, "", "requested");
}
