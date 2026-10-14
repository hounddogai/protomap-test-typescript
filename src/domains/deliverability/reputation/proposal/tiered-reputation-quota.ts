import * as text from "../../../../kit/text.js";

/** Where a tiered reputation quota is in its life cycle. */
export type TieredReputationQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered reputation quota and its current status. */
export class TieredReputationQuota {
  code: string;
  title: string;
  priority: number;
  country: string;
  locale: string;
  expiresAt: number;
  category: string;
  status: TieredReputationQuotaStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    country: string,
    locale: string,
    expiresAt: number,
    category: string,
    status: TieredReputationQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.country = country;
    this.locale = locale;
    this.expiresAt = expiresAt;
    this.category = category;
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

  canMoveTo(next: TieredReputationQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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

  moveTo(next: TieredReputationQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reputation quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered reputation quota"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.expiresAt * this.priority * 100) / 100;
  }

  copy(): TieredReputationQuota {
    return new TieredReputationQuota(
      this.code,
      this.title,
      this.priority,
      this.country,
      this.locale,
      this.expiresAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered reputation quota in status proposed. */
export function newTieredReputationQuota(code: string, title: string): TieredReputationQuota {
  return new TieredReputationQuota(code, title, 0, "", "", 0, "", "proposed");
}
