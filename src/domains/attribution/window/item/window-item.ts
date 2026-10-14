/**
 * The window item records of attribution's window work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window item is in its life cycle. */
export type WindowItemStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window item as the window team keeps it. */
export class WindowItem {
  code: string;
  label: string;
  startsAt: number;
  pinned: boolean;
  quantity: number;
  status: WindowItemStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    pinned: boolean,
    quantity: number,
    status: WindowItemStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.pinned = pinned;
    this.quantity = quantity;
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

  canMoveTo(next: WindowItemStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity + this.startsAt) * 100) / 100;
  }

  copy(): WindowItem {
    return new WindowItem(this.code, this.label, this.startsAt, this.pinned, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window item in status open. */
export function newWindowItem(code: string, label: string): WindowItem {
  return new WindowItem(code, label, 0, false, 0, "open");
}
