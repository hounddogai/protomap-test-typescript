/**
 * The bounce profile records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce profile is in its life cycle. */
export type BounceProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bounce profile as the bounce team keeps it. */
export class BounceProfile {
  code: string;
  label: string;
  createdAt: number;
  visible: boolean;
  checksum: string;
  discount: number;
  status: BounceProfileStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    visible: boolean,
    checksum: string,
    discount: number,
    status: BounceProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.visible = visible;
    this.checksum = checksum;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BounceProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.discount - this.createdAt) * 100) / 100;
  }

  copy(): BounceProfile {
    return new BounceProfile(
      this.code,
      this.label,
      this.createdAt,
      this.visible,
      this.checksum,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a bounce profile in status open. */
export function newBounceProfile(code: string, label: string): BounceProfile {
  return new BounceProfile(code, label, 0, false, "", 0, "open");
}
