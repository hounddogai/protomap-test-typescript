/**
 * The bounce milestone records of deliverability's bounce work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce milestone is in its life cycle. */
export type BounceMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A bounce milestone. Its code is unique within a tenant. */
export class BounceMilestone {
  code: string;
  name: string;
  priority: number;
  description: string;
  bid: number;
  visible: boolean;
  timezone: string;
  revision: number;
  unit: string;
  status: BounceMilestoneStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    description: string,
    bid: number,
    visible: boolean,
    timezone: string,
    revision: number,
    unit: string,
    status: BounceMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.description = description;
    this.bid = bid;
    this.visible = visible;
    this.timezone = timezone;
    this.revision = revision;
    this.unit = unit;
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

  canMoveTo(next: BounceMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round((this.revision - this.priority) * 100) / 100;
  }

  copy(): BounceMilestone {
    return new BounceMilestone(
      this.code,
      this.name,
      this.priority,
      this.description,
      this.bid,
      this.visible,
      this.timezone,
      this.revision,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bounce milestone in status draft. */
export function newBounceMilestone(code: string, name: string): BounceMilestone {
  return new BounceMilestone(code, name, 0, "", 0, false, "", 0, "", "draft");
}
