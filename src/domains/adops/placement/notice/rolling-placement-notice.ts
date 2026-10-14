/**
 * The rolling placement notice records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling placement notice is in its life cycle. */
export type RollingPlacementNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling placement notice as the placement team keeps it. */
export class RollingPlacementNotice {
  code: string;
  name: string;
  rate: number;
  ownerId: string;
  budget: number;
  locale: string;
  status: RollingPlacementNoticeStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    ownerId: string,
    budget: number,
    locale: string,
    status: RollingPlacementNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.ownerId = ownerId;
    this.budget = budget;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingPlacementNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingPlacementNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling placement notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling placement notice"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.budget - this.rate) * 100) / 100;
  }

  copy(): RollingPlacementNotice {
    return new RollingPlacementNotice(
      this.code,
      this.name,
      this.rate,
      this.ownerId,
      this.budget,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling placement notice in status draft. */
export function newRollingPlacementNotice(code: string, name: string): RollingPlacementNotice {
  return new RollingPlacementNotice(code, name, 0, "", 0, "", "draft");
}
