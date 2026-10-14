import * as text from "../../../../kit/text.js";

/** Where a manual badge milestone is in its life cycle. */
export type ManualBadgeMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual badge milestone. Its code is unique within a tenant. */
export class ManualBadgeMilestone {
  code: string;
  name: string;
  currency: string;
  active: boolean;
  priority: number;
  status: ManualBadgeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    active: boolean,
    priority: number,
    status: ManualBadgeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.active = active;
    this.priority = priority;
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

  canMoveTo(next: ManualBadgeMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualBadgeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual badge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual badge milestone"} ${this.code}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): ManualBadgeMilestone {
    return new ManualBadgeMilestone(this.code, this.name, this.currency, this.active, this.priority, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual badge milestone in status new. */
export function newManualBadgeMilestone(code: string, name: string): ManualBadgeMilestone {
  return new ManualBadgeMilestone(code, name, "", false, 0, "new");
}
