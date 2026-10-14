import * as text from "../../../../kit/text.js";

/** Where a credit override is in its life cycle. */
export type CreditOverrideStatus = "created" | "validated" | "published" | "retired";

/** A credit override as the credit team keeps it. */
export class CreditOverride {
  code: string;
  name: string;
  locale: string;
  minimum: number;
  amount: number;
  sendAt: number;
  phone: string;
  externalRef: string;
  impressions: number;
  visible: boolean;
  label: string;
  status: CreditOverrideStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    minimum: number,
    amount: number,
    sendAt: number,
    phone: string,
    externalRef: string,
    impressions: number,
    visible: boolean,
    label: string,
    status: CreditOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.minimum = minimum;
    this.amount = amount;
    this.sendAt = sendAt;
    this.phone = phone;
    this.externalRef = externalRef;
    this.impressions = impressions;
    this.visible = visible;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CreditOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"credit override"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.amount - this.impressions) * 100) / 100;
  }

  copy(): CreditOverride {
    return new CreditOverride(
      this.code,
      this.name,
      this.locale,
      this.minimum,
      this.amount,
      this.sendAt,
      this.phone,
      this.externalRef,
      this.impressions,
      this.visible,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit override in status created. */
export function newCreditOverride(code: string, name: string): CreditOverride {
  return new CreditOverride(code, name, "", 0, 0, 0, "", "", 0, false, "", "created");
}
