import * as text from "../../../../kit/text.js";

/** Where a default badge slot is in its life cycle. */
export type DefaultBadgeSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default badge slot as the badge team keeps it. */
export class DefaultBadgeSlot {
  code: string;
  name: string;
  quantity: number;
  budget: number;
  locale: string;
  startsAt: number;
  phone: string;
  region: string;
  campaignRef: string;
  description: string;
  status: DefaultBadgeSlotStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    budget: number,
    locale: string,
    startsAt: number,
    phone: string,
    region: string,
    campaignRef: string,
    description: string,
    status: DefaultBadgeSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.budget = budget;
    this.locale = locale;
    this.startsAt = startsAt;
    this.phone = phone;
    this.region = region;
    this.campaignRef = campaignRef;
    this.description = description;
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

  canMoveTo(next: DefaultBadgeSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultBadgeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default badge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default badge slot"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt - this.quantity) * 100) / 100;
  }

  copy(): DefaultBadgeSlot {
    return new DefaultBadgeSlot(
      this.code,
      this.name,
      this.quantity,
      this.budget,
      this.locale,
      this.startsAt,
      this.phone,
      this.region,
      this.campaignRef,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default badge slot in status proposed. */
export function newDefaultBadgeSlot(code: string, name: string): DefaultBadgeSlot {
  return new DefaultBadgeSlot(code, name, 0, 0, "", 0, "", "", "", "", "proposed");
}
