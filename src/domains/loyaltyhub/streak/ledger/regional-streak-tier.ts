import * as text from "../../../../kit/text.js";

/** Where a regional streak tier is in its life cycle. */
export type RegionalStreakTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional streak tier, with what the planners need to act on it. */
export class RegionalStreakTier {
  code: string;
  name: string;
  priority: number;
  contactEmail: string;
  batchSize: number;
  title: string;
  phone: string;
  status: RegionalStreakTierStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    contactEmail: string,
    batchSize: number,
    title: string,
    phone: string,
    status: RegionalStreakTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.title = title;
    this.phone = phone;
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

  canMoveTo(next: RegionalStreakTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalStreakTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize - this.priority) * 100) / 100;
  }

  copy(): RegionalStreakTier {
    return new RegionalStreakTier(
      this.code,
      this.name,
      this.priority,
      this.contactEmail,
      this.batchSize,
      this.title,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional streak tier in status idle. */
export function newRegionalStreakTier(code: string, name: string): RegionalStreakTier {
  return new RegionalStreakTier(code, name, 0, "", 0, "", "", "idle");
}
