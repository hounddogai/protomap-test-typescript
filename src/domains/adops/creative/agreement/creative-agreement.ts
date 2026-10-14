/**
 * The creative agreement records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative agreement is in its life cycle. */
export type CreativeAgreementStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A creative agreement. Its code is unique within a tenant. */
export class CreativeAgreement {
  code: string;
  name: string;
  maximum: number;
  amount: number;
  impressions: number;
  status: CreativeAgreementStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    amount: number,
    impressions: number,
    status: CreativeAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.amount = amount;
    this.impressions = impressions;
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

  canMoveTo(next: CreativeAgreementStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
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

  moveTo(next: CreativeAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"creative agreement"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions - this.maximum) * 100) / 100;
  }

  copy(): CreativeAgreement {
    return new CreativeAgreement(this.code, this.name, this.maximum, this.amount, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative agreement in status draft. */
export function newCreativeAgreement(code: string, name: string): CreativeAgreement {
  return new CreativeAgreement(code, name, 0, 0, 0, "draft");
}
