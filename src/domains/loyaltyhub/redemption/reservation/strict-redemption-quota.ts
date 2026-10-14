import * as text from "../../../../kit/text.js";

/** Where a strict redemption quota is in its life cycle. */
export type StrictRedemptionQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict redemption quota. Its code is unique within a tenant. */
export class StrictRedemptionQuota {
  code: string;
  title: string;
  quantity: number;
  region: string;
  category: string;
  archived: boolean;
  status: StrictRedemptionQuotaStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    region: string,
    category: string,
    archived: boolean,
    status: StrictRedemptionQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.region = region;
    this.category = category;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictRedemptionQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictRedemptionQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict redemption quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): StrictRedemptionQuota {
    return new StrictRedemptionQuota(
      this.code,
      this.title,
      this.quantity,
      this.region,
      this.category,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict redemption quota in status proposed. */
export function newStrictRedemptionQuota(code: string, title: string): StrictRedemptionQuota {
  return new StrictRedemptionQuota(code, title, 0, "", "", false, "proposed");
}
