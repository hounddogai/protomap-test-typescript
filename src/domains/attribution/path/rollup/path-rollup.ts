/**
 * The path rollup records of attribution's path work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a path rollup is in its life cycle. */
export type PathRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A path rollup. Its code is unique within a tenant. */
export class PathRollup {
  code: string;
  title: string;
  amount: number;
  minimum: number;
  budget: number;
  frequencyCap: number;
  utmSource: string;
  capacity: number;
  status: PathRollupStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    minimum: number,
    budget: number,
    frequencyCap: number,
    utmSource: string,
    capacity: number,
    status: PathRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.minimum = minimum;
    this.budget = budget;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.capacity = capacity;
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

  canMoveTo(next: PathRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PathRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.amount + this.frequencyCap) * 100) / 100;
  }

  copy(): PathRollup {
    return new PathRollup(
      this.code,
      this.title,
      this.amount,
      this.minimum,
      this.budget,
      this.frequencyCap,
      this.utmSource,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a path rollup in status planned. */
export function newPathRollup(code: string, title: string): PathRollup {
  return new PathRollup(code, title, 0, 0, 0, 0, "", 0, "planned");
}
