/**
 * The exit rule digest records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule digest is in its life cycle. */
export type ExitRuleDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A exit rule digest. Its code is unique within a tenant. */
export class ExitRuleDigest {
  code: string;
  label: string;
  ownerId: string;
  currency: string;
  contactEmail: string;
  openRate: number;
  journeyId: string;
  status: ExitRuleDigestStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    currency: string,
    contactEmail: string,
    openRate: number,
    journeyId: string,
    status: ExitRuleDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.journeyId = journeyId;
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

  canMoveTo(next: ExitRuleDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ExitRuleDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): ExitRuleDigest {
    return new ExitRuleDigest(
      this.code,
      this.label,
      this.ownerId,
      this.currency,
      this.contactEmail,
      this.openRate,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a exit rule digest in status requested. */
export function newExitRuleDigest(code: string, label: string): ExitRuleDigest {
  return new ExitRuleDigest(code, label, "", "", "", 0, "", "requested");
}
