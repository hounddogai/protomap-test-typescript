/**
 * The global tier manifest records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global tier manifest is in its life cycle. */
export type GlobalTierManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One global tier manifest, with what the planners need to act on it. */
export class GlobalTierManifest {
  code: string;
  name: string;
  discount: number;
  maximum: number;
  phone: string;
  status: GlobalTierManifestStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    maximum: number,
    phone: string,
    status: GlobalTierManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.maximum = maximum;
    this.phone = phone;
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

  canMoveTo(next: GlobalTierManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalTierManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global tier manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global tier manifest"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.discount * this.maximum * 100) / 100;
  }

  copy(): GlobalTierManifest {
    return new GlobalTierManifest(this.code, this.name, this.discount, this.maximum, this.phone, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global tier manifest in status planned. */
export function newGlobalTierManifest(code: string, name: string): GlobalTierManifest {
  return new GlobalTierManifest(code, name, 0, 0, "", "planned");
}
