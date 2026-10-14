/**
 * The manual streak target records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual streak target is in its life cycle. */
export type ManualStreakTargetStatus = "created" | "validated" | "published" | "retired";

/** A manual streak target. Its code is unique within a tenant. */
export class ManualStreakTarget {
  code: string;
  name: string;
  locale: string;
  startsAt: number;
  threshold: number;
  visible: boolean;
  status: ManualStreakTargetStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    startsAt: number,
    threshold: number,
    visible: boolean,
    status: ManualStreakTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.startsAt = startsAt;
    this.threshold = threshold;
    this.visible = visible;
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

  canMoveTo(next: ManualStreakTargetStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualStreakTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual streak target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedTotal(): number {
    return Math.round((this.startsAt - this.threshold) * 100) / 100;
  }

  copy(): ManualStreakTarget {
    return new ManualStreakTarget(
      this.code,
      this.name,
      this.locale,
      this.startsAt,
      this.threshold,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual streak target in status created. */
export function newManualStreakTarget(code: string, name: string): ManualStreakTarget {
  return new ManualStreakTarget(code, name, "", 0, 0, false, "created");
}
