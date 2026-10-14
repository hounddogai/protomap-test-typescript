/**
 * The cohort window records of growth's cohort work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a cohort window is in its life cycle. */
export type CohortWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One cohort window, with what the planners need to act on it. */
export class CohortWindow {
  code: string;
  name: string;
  cost: number;
  country: string;
  audienceId: string;
  phone: string;
  expiresAt: number;
  bid: number;
  createdAt: number;
  status: CohortWindowStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    country: string,
    audienceId: string,
    phone: string,
    expiresAt: number,
    bid: number,
    createdAt: number,
    status: CohortWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.country = country;
    this.audienceId = audienceId;
    this.phone = phone;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.createdAt = createdAt;
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

  canMoveTo(next: CohortWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CohortWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedTotal(): number {
    return Math.round(this.bid * this.createdAt * 100) / 100;
  }

  copy(): CohortWindow {
    return new CohortWindow(
      this.code,
      this.name,
      this.cost,
      this.country,
      this.audienceId,
      this.phone,
      this.expiresAt,
      this.bid,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a cohort window in status idle. */
export function newCohortWindow(code: string, name: string): CohortWindow {
  return new CohortWindow(code, name, 0, "", "", "", 0, 0, 0, "idle");
}
