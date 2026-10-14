/**
 * The pending opt out baseline records of consentcenter's opt out work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending opt out baseline is in its life cycle. */
export type PendingOptOutBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending opt out baseline and its current status. */
export class PendingOptOutBaseline {
  code: string;
  name: string;
  margin: number;
  attempts: number;
  phone: string;
  category: string;
  active: boolean;
  description: string;
  utmSource: string;
  visible: boolean;
  status: PendingOptOutBaselineStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    attempts: number,
    phone: string,
    category: string,
    active: boolean,
    description: string,
    utmSource: string,
    visible: boolean,
    status: PendingOptOutBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.attempts = attempts;
    this.phone = phone;
    this.category = category;
    this.active = active;
    this.description = description;
    this.utmSource = utmSource;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingOptOutBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingOptOutBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending opt out baseline"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin - this.attempts) * 100) / 100;
  }

  copy(): PendingOptOutBaseline {
    return new PendingOptOutBaseline(
      this.code,
      this.name,
      this.margin,
      this.attempts,
      this.phone,
      this.category,
      this.active,
      this.description,
      this.utmSource,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending opt out baseline in status new. */
export function newPendingOptOutBaseline(code: string, name: string): PendingOptOutBaseline {
  return new PendingOptOutBaseline(code, name, 0, 0, "", "", false, "", "", false, "new");
}
