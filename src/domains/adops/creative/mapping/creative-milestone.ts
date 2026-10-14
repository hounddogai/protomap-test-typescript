import * as text from "../../../../kit/text.js";

/** Where a creative milestone is in its life cycle. */
export type CreativeMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One creative milestone, with what the planners need to act on it. */
export class CreativeMilestone {
  code: string;
  name: string;
  capacity: number;
  active: boolean;
  version: number;
  locale: string;
  currency: string;
  status: CreativeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    active: boolean,
    version: number,
    locale: string,
    currency: string,
    status: CreativeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.active = active;
    this.version = version;
    this.locale = locale;
    this.currency = currency;
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

  canMoveTo(next: CreativeMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"creative milestone"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.version + this.capacity) * 100) / 100;
  }

  copy(): CreativeMilestone {
    return new CreativeMilestone(
      this.code,
      this.name,
      this.capacity,
      this.active,
      this.version,
      this.locale,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a creative milestone in status planned. */
export function newCreativeMilestone(code: string, name: string): CreativeMilestone {
  return new CreativeMilestone(code, name, 0, false, 0, "", "", "planned");
}
