/**
 * The fallback macro snapshot records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback macro snapshot is in its life cycle. */
export type FallbackMacroSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One fallback macro snapshot, with what the planners need to act on it. */
export class FallbackMacroSnapshot {
  code: string;
  name: string;
  rate: number;
  budget: number;
  discount: number;
  bid: number;
  sendAt: number;
  locale: string;
  status: FallbackMacroSnapshotStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    budget: number,
    discount: number,
    bid: number,
    sendAt: number,
    locale: string,
    status: FallbackMacroSnapshotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.budget = budget;
    this.discount = discount;
    this.bid = bid;
    this.sendAt = sendAt;
    this.locale = locale;
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

  canMoveTo(next: FallbackMacroSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackMacroSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback macro snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round(this.budget * this.discount * 100) / 100;
  }

  copy(): FallbackMacroSnapshot {
    return new FallbackMacroSnapshot(
      this.code,
      this.name,
      this.rate,
      this.budget,
      this.discount,
      this.bid,
      this.sendAt,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback macro snapshot in status planned. */
export function newFallbackMacroSnapshot(code: string, name: string): FallbackMacroSnapshot {
  return new FallbackMacroSnapshot(code, name, 0, 0, 0, 0, 0, "", "planned");
}
