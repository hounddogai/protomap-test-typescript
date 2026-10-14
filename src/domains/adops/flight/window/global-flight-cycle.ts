import * as text from "../../../../kit/text.js";

/** Where a global flight cycle is in its life cycle. */
export type GlobalFlightCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global flight cycle as the flight team keeps it. */
export class GlobalFlightCycle {
  code: string;
  label: string;
  notes: string;
  active: boolean;
  batchSize: number;
  status: GlobalFlightCycleStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    active: boolean,
    batchSize: number,
    status: GlobalFlightCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.active = active;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalFlightCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalFlightCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): GlobalFlightCycle {
    return new GlobalFlightCycle(this.code, this.label, this.notes, this.active, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global flight cycle in status idle. */
export function newGlobalFlightCycle(code: string, label: string): GlobalFlightCycle {
  return new GlobalFlightCycle(code, label, "", false, 0, "idle");
}
