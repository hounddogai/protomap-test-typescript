/**
 * The fallback creative window records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback creative window is in its life cycle. */
export type FallbackCreativeWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a fallback creative window and its current status. */
export class FallbackCreativeWindow {
  code: string;
  label: string;
  version: number;
  country: string;
  archived: boolean;
  openRate: number;
  status: FallbackCreativeWindowStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    country: string,
    archived: boolean,
    openRate: number,
    status: FallbackCreativeWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.country = country;
    this.archived = archived;
    this.openRate = openRate;
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

  canMoveTo(next: FallbackCreativeWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FallbackCreativeWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback creative window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"fallback creative window"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.openRate * this.version * 100) / 100;
  }

  copy(): FallbackCreativeWindow {
    return new FallbackCreativeWindow(
      this.code,
      this.label,
      this.version,
      this.country,
      this.archived,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback creative window in status requested. */
export function newFallbackCreativeWindow(code: string, label: string): FallbackCreativeWindow {
  return new FallbackCreativeWindow(code, label, 0, "", false, 0, "requested");
}
