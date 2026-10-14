/**
 * The bounce window records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce window is in its life cycle. */
export type BounceWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bounce window. Its code is unique within a tenant. */
export class BounceWindow {
  code: string;
  title: string;
  contactEmail: string;
  weight: number;
  cost: number;
  status: BounceWindowStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    weight: number,
    cost: number,
    status: BounceWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.cost = cost;
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

  canMoveTo(next: BounceWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.cost - this.weight) * 100) / 100;
  }

  copy(): BounceWindow {
    return new BounceWindow(this.code, this.title, this.contactEmail, this.weight, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bounce window in status open. */
export function newBounceWindow(code: string, title: string): BounceWindow {
  return new BounceWindow(code, title, "", 0, 0, "open");
}
