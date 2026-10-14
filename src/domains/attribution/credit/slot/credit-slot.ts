/**
 * The credit slot records of attribution's credit work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit slot is in its life cycle. */
export type CreditSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A credit slot as the credit team keeps it. */
export class CreditSlot {
  code: string;
  title: string;
  openRate: number;
  maximum: number;
  tags: string[];
  quantity: number;
  phone: string;
  priority: number;
  status: CreditSlotStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    maximum: number,
    tags: string[],
    quantity: number,
    phone: string,
    priority: number,
    status: CreditSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.maximum = maximum;
    this.tags = tags;
    this.quantity = quantity;
    this.phone = phone;
    this.priority = priority;
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

  canMoveTo(next: CreditSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreditSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.maximum + this.priority) * 100) / 100;
  }

  copy(): CreditSlot {
    return new CreditSlot(
      this.code,
      this.title,
      this.openRate,
      this.maximum,
      this.tags,
      this.quantity,
      this.phone,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a credit slot in status requested. */
export function newCreditSlot(code: string, title: string): CreditSlot {
  return new CreditSlot(code, title, 0, 0, [], 0, "", 0, "requested");
}
