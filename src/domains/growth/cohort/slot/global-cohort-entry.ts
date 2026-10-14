import * as text from "../../../../kit/text.js";

/** Where a global cohort entry is in its life cycle. */
export type GlobalCohortEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A global cohort entry as the cohort team keeps it. */
export class GlobalCohortEntry {
  code: string;
  name: string;
  approved: boolean;
  cost: number;
  active: boolean;
  retries: number;
  title: string;
  status: GlobalCohortEntryStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    cost: number,
    active: boolean,
    retries: number,
    title: string,
    status: GlobalCohortEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.cost = cost;
    this.active = active;
    this.retries = retries;
    this.title = title;
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

  canMoveTo(next: GlobalCohortEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
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

  moveTo(next: GlobalCohortEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global cohort entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.retries + this.cost) * 100) / 100;
  }

  copy(): GlobalCohortEntry {
    return new GlobalCohortEntry(
      this.code,
      this.name,
      this.approved,
      this.cost,
      this.active,
      this.retries,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global cohort entry in status idle. */
export function newGlobalCohortEntry(code: string, name: string): GlobalCohortEntry {
  return new GlobalCohortEntry(code, name, false, 0, false, 0, "", "idle");
}
