/**
 * The global placement adjustment records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global placement adjustment is in its life cycle. */
export type GlobalPlacementAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global placement adjustment. Its code is unique within a tenant. */
export class GlobalPlacementAdjustment {
  code: string;
  title: string;
  archived: boolean;
  startsAt: number;
  country: string;
  revision: number;
  active: boolean;
  status: GlobalPlacementAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    startsAt: number,
    country: string,
    revision: number,
    active: boolean,
    status: GlobalPlacementAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.startsAt = startsAt;
    this.country = country;
    this.revision = revision;
    this.active = active;
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

  canMoveTo(next: GlobalPlacementAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalPlacementAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global placement adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"global placement adjustment"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.startsAt * this.revision * 100) / 100;
  }

  copy(): GlobalPlacementAdjustment {
    return new GlobalPlacementAdjustment(
      this.code,
      this.title,
      this.archived,
      this.startsAt,
      this.country,
      this.revision,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global placement adjustment in status open. */
export function newGlobalPlacementAdjustment(code: string, title: string): GlobalPlacementAdjustment {
  return new GlobalPlacementAdjustment(code, title, false, 0, "", 0, false, "open");
}
