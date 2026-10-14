/**
 * The macro draft records of support's macro work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a macro draft is in its life cycle. */
export type MacroDraftStatus = "created" | "validated" | "published" | "retired";

/** A macro draft. Its code is unique within a tenant. */
export class MacroDraft {
  code: string;
  title: string;
  cost: number;
  priority: number;
  pinned: boolean;
  status: MacroDraftStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    priority: number,
    pinned: boolean,
    status: MacroDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.priority = priority;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MacroDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedValue(): number {
    return Math.round(this.priority * this.cost * 100) / 100;
  }

  copy(): MacroDraft {
    return new MacroDraft(this.code, this.title, this.cost, this.priority, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro draft in status created. */
export function newMacroDraft(code: string, title: string): MacroDraft {
  return new MacroDraft(code, title, 0, 0, false, "created");
}
