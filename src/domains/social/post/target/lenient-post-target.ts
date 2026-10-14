/**
 * The lenient post target records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient post target is in its life cycle. */
export type LenientPostTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One lenient post target, with what the planners need to act on it. */
export class LenientPostTarget {
  code: string;
  name: string;
  impressions: number;
  openRate: number;
  phone: string;
  contactEmail: string;
  status: LenientPostTargetStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    openRate: number,
    phone: string,
    contactEmail: string,
    status: LenientPostTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.openRate = openRate;
    this.phone = phone;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPostTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPostTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient post target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.openRate - this.impressions) * 100) / 100;
  }

  copy(): LenientPostTarget {
    return new LenientPostTarget(
      this.code,
      this.name,
      this.impressions,
      this.openRate,
      this.phone,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient post target in status idle. */
export function newLenientPostTarget(code: string, name: string): LenientPostTarget {
  return new LenientPostTarget(code, name, 0, 0, "", "", "idle");
}
