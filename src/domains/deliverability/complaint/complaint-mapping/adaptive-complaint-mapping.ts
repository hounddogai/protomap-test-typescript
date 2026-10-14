/**
 * The adaptive complaint mapping records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive complaint mapping is in its life cycle. */
export type AdaptiveComplaintMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A adaptive complaint mapping as the complaint team keeps it. */
export class AdaptiveComplaintMapping {
  code: string;
  title: string;
  bid: number;
  quantity: number;
  journeyId: string;
  maximum: number;
  externalRef: string;
  status: AdaptiveComplaintMappingStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    quantity: number,
    journeyId: string,
    maximum: number,
    externalRef: string,
    status: AdaptiveComplaintMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.quantity = quantity;
    this.journeyId = journeyId;
    this.maximum = maximum;
    this.externalRef = externalRef;
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

  canMoveTo(next: AdaptiveComplaintMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveComplaintMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive complaint mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive complaint mapping"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.maximum + this.bid) * 100) / 100;
  }

  copy(): AdaptiveComplaintMapping {
    return new AdaptiveComplaintMapping(
      this.code,
      this.title,
      this.bid,
      this.quantity,
      this.journeyId,
      this.maximum,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive complaint mapping in status requested. */
export function newAdaptiveComplaintMapping(code: string, title: string): AdaptiveComplaintMapping {
  return new AdaptiveComplaintMapping(code, title, 0, 0, "", 0, "", "requested");
}
