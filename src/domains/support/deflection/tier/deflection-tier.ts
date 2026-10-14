/**
 * The deflection tier records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection tier is in its life cycle. */
export type DeflectionTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One deflection tier, with what the planners need to act on it. */
export class DeflectionTier {
  code: string;
  title: string;
  bid: number;
  rate: number;
  archived: boolean;
  ownerId: string;
  notes: string;
  discount: number;
  status: DeflectionTierStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    rate: number,
    archived: boolean,
    ownerId: string,
    notes: string,
    discount: number,
    status: DeflectionTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.rate = rate;
    this.archived = archived;
    this.ownerId = ownerId;
    this.notes = notes;
    this.discount = discount;
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

  canMoveTo(next: DeflectionTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DeflectionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round((this.discount - this.bid) * 100) / 100;
  }

  copy(): DeflectionTier {
    return new DeflectionTier(
      this.code,
      this.title,
      this.bid,
      this.rate,
      this.archived,
      this.ownerId,
      this.notes,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a deflection tier in status idle. */
export function newDeflectionTier(code: string, title: string): DeflectionTier {
  return new DeflectionTier(code, title, 0, 0, false, "", "", 0, "idle");
}
