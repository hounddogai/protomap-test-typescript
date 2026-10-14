import * as text from "../../../../kit/text.js";

/** Where a complaint quota is in its life cycle. */
export type ComplaintQuotaStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A complaint quota. Its code is unique within a tenant. */
export class ComplaintQuota {
  code: string;
  name: string;
  createdAt: number;
  region: string;
  discount: number;
  phone: string;
  ceiling: number;
  locale: string;
  status: ComplaintQuotaStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    region: string,
    discount: number,
    phone: string,
    ceiling: number,
    locale: string,
    status: ComplaintQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.region = region;
    this.discount = discount;
    this.phone = phone;
    this.ceiling = ceiling;
    this.locale = locale;
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

  canMoveTo(next: ComplaintQuotaStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ComplaintQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.createdAt * this.discount * 100) / 100;
  }

  copy(): ComplaintQuota {
    return new ComplaintQuota(
      this.code,
      this.name,
      this.createdAt,
      this.region,
      this.discount,
      this.phone,
      this.ceiling,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a complaint quota in status planned. */
export function newComplaintQuota(code: string, name: string): ComplaintQuota {
  return new ComplaintQuota(code, name, 0, "", 0, "", 0, "", "planned");
}
