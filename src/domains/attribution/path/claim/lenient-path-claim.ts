/**
 * The lenient path claim records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient path claim is in its life cycle. */
export type LenientPathClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient path claim as the path team keeps it. */
export class LenientPathClaim {
  code: string;
  name: string;
  ratio: number;
  country: string;
  revision: number;
  priority: number;
  updatedAt: number;
  approved: boolean;
  status: LenientPathClaimStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    country: string,
    revision: number,
    priority: number,
    updatedAt: number,
    approved: boolean,
    status: LenientPathClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.country = country;
    this.revision = revision;
    this.priority = priority;
    this.updatedAt = updatedAt;
    this.approved = approved;
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

  canMoveTo(next: LenientPathClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPathClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient path claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"lenient path claim"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.ratio - this.updatedAt) * 100) / 100;
  }

  copy(): LenientPathClaim {
    return new LenientPathClaim(
      this.code,
      this.name,
      this.ratio,
      this.country,
      this.revision,
      this.priority,
      this.updatedAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a lenient path claim in status planned. */
export function newLenientPathClaim(code: string, name: string): LenientPathClaim {
  return new LenientPathClaim(code, name, 0, "", 0, 0, 0, false, "planned");
}
