import * as text from "../../../../kit/text.js";

/** Where a global deflection cycle is in its life cycle. */
export type GlobalDeflectionCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a global deflection cycle and its current status. */
export class GlobalDeflectionCycle {
  code: string;
  name: string;
  priority: number;
  threshold: number;
  attempts: number;
  batchSize: number;
  country: string;
  notes: string;
  pinned: boolean;
  status: GlobalDeflectionCycleStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    threshold: number,
    attempts: number,
    batchSize: number,
    country: string,
    notes: string,
    pinned: boolean,
    status: GlobalDeflectionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.threshold = threshold;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.country = country;
    this.notes = notes;
    this.pinned = pinned;
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

  canMoveTo(next: GlobalDeflectionCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalDeflectionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global deflection cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round(this.priority * this.batchSize * 100) / 100;
  }

  copy(): GlobalDeflectionCycle {
    return new GlobalDeflectionCycle(
      this.code,
      this.name,
      this.priority,
      this.threshold,
      this.attempts,
      this.batchSize,
      this.country,
      this.notes,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global deflection cycle in status draft. */
export function newGlobalDeflectionCycle(code: string, name: string): GlobalDeflectionCycle {
  return new GlobalDeflectionCycle(code, name, 0, 0, 0, 0, "", "", false, "draft");
}
