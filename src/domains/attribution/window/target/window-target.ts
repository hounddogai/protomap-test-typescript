/**
 * The window target records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window target is in its life cycle. */
export type WindowTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a window target and its current status. */
export class WindowTarget {
  code: string;
  name: string;
  campaignRef: string;
  frequencyCap: number;
  weight: number;
  endsAt: number;
  status: WindowTargetStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    frequencyCap: number,
    weight: number,
    endsAt: number,
    status: WindowTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.endsAt = endsAt;
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

  canMoveTo(next: WindowTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WindowTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window target"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.weight * this.endsAt * 100) / 100;
  }

  copy(): WindowTarget {
    return new WindowTarget(
      this.code,
      this.name,
      this.campaignRef,
      this.frequencyCap,
      this.weight,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window target in status requested. */
export function newWindowTarget(code: string, name: string): WindowTarget {
  return new WindowTarget(code, name, "", 0, 0, 0, "requested");
}
