import * as text from "../../../../kit/text.js";

/** Where a deflection record is in its life cycle. */
export type DeflectionRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A deflection record. Its code is unique within a tenant. */
export class DeflectionRecord {
  code: string;
  name: string;
  country: string;
  category: string;
  openRate: number;
  quantity: number;
  windowDays: number;
  discount: number;
  currency: string;
  status: DeflectionRecordStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    category: string,
    openRate: number,
    quantity: number,
    windowDays: number,
    discount: number,
    currency: string,
    status: DeflectionRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.category = category;
    this.openRate = openRate;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.discount = discount;
    this.currency = currency;
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

  canMoveTo(next: DeflectionRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: DeflectionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedVolume(): number {
    return Math.round((this.openRate + this.quantity) * 100) / 100;
  }

  copy(): DeflectionRecord {
    return new DeflectionRecord(
      this.code,
      this.name,
      this.country,
      this.category,
      this.openRate,
      this.quantity,
      this.windowDays,
      this.discount,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a deflection record in status draft. */
export function newDeflectionRecord(code: string, name: string): DeflectionRecord {
  return new DeflectionRecord(code, name, "", "", 0, 0, 0, 0, "", "draft");
}
