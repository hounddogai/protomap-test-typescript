/**
 * The primary sla agreement records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary sla agreement is in its life cycle. */
export type PrimarySlaAgreementStatus = "created" | "validated" | "published" | "retired";

/** A primary sla agreement as the sla team keeps it. */
export class PrimarySlaAgreement {
  code: string;
  title: string;
  quantity: number;
  threshold: number;
  impressions: number;
  status: PrimarySlaAgreementStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    threshold: number,
    impressions: number,
    status: PrimarySlaAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.threshold = threshold;
    this.impressions = impressions;
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

  canMoveTo(next: PrimarySlaAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySlaAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.threshold + this.quantity) * 100) / 100;
  }

  copy(): PrimarySlaAgreement {
    return new PrimarySlaAgreement(this.code, this.title, this.quantity, this.threshold, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary sla agreement in status created. */
export function newPrimarySlaAgreement(code: string, title: string): PrimarySlaAgreement {
  return new PrimarySlaAgreement(code, title, 0, 0, 0, "created");
}
