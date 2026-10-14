/**
 * The credit claim records of attribution's credit work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit claim is in its life cycle. */
export type CreditClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A credit claim. Its code is unique within a tenant. */
export class CreditClaim {
  code: string;
  name: string;
  locale: string;
  impressions: number;
  visible: boolean;
  checksum: string;
  description: string;
  status: CreditClaimStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    impressions: number,
    visible: boolean,
    checksum: string,
    description: string,
    status: CreditClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.impressions = impressions;
    this.visible = visible;
    this.checksum = checksum;
    this.description = description;
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

  canMoveTo(next: CreditClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: CreditClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"credit claim"} ${this.code}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): CreditClaim {
    return new CreditClaim(
      this.code,
      this.name,
      this.locale,
      this.impressions,
      this.visible,
      this.checksum,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a credit claim in status planned. */
export function newCreditClaim(code: string, name: string): CreditClaim {
  return new CreditClaim(code, name, "", 0, false, "", "", "planned");
}
