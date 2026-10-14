/**
 * The strict creative cycle records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict creative cycle is in its life cycle. */
export type StrictCreativeCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A strict creative cycle as the creative team keeps it. */
export class StrictCreativeCycle {
  code: string;
  title: string;
  utmSource: string;
  label: string;
  active: boolean;
  unit: string;
  amount: number;
  status: StrictCreativeCycleStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    label: string,
    active: boolean,
    unit: string,
    amount: number,
    status: StrictCreativeCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.label = label;
    this.active = active;
    this.unit = unit;
    this.amount = amount;
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

  canMoveTo(next: StrictCreativeCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: StrictCreativeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): StrictCreativeCycle {
    return new StrictCreativeCycle(
      this.code,
      this.title,
      this.utmSource,
      this.label,
      this.active,
      this.unit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict creative cycle in status new. */
export function newStrictCreativeCycle(code: string, title: string): StrictCreativeCycle {
  return new StrictCreativeCycle(code, title, "", "", false, "", 0, "new");
}
