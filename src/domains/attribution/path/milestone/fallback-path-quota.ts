import * as text from "../../../../kit/text.js";

/** Where a fallback path quota is in its life cycle. */
export type FallbackPathQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One fallback path quota, with what the planners need to act on it. */
export class FallbackPathQuota {
  code: string;
  label: string;
  version: number;
  category: string;
  currency: string;
  contactEmail: string;
  cost: number;
  status: FallbackPathQuotaStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    category: string,
    currency: string,
    contactEmail: string,
    cost: number,
    status: FallbackPathQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.category = category;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackPathQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackPathQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback path quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"fallback path quota"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.version + this.cost) * 100) / 100;
  }

  copy(): FallbackPathQuota {
    return new FallbackPathQuota(
      this.code,
      this.label,
      this.version,
      this.category,
      this.currency,
      this.contactEmail,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback path quota in status planned. */
export function newFallbackPathQuota(code: string, label: string): FallbackPathQuota {
  return new FallbackPathQuota(code, label, 0, "", "", "", 0, "planned");
}
