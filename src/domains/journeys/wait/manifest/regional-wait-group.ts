import * as text from "../../../../kit/text.js";

/** Where a regional wait group is in its life cycle. */
export type RegionalWaitGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional wait group as the wait team keeps it. */
export class RegionalWaitGroup {
  code: string;
  name: string;
  archived: boolean;
  tags: string[];
  timezone: string;
  campaignRef: string;
  attempts: number;
  ceiling: number;
  quantity: number;
  openRate: number;
  status: RegionalWaitGroupStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    tags: string[],
    timezone: string,
    campaignRef: string,
    attempts: number,
    ceiling: number,
    quantity: number,
    openRate: number,
    status: RegionalWaitGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.tags = tags;
    this.timezone = timezone;
    this.campaignRef = campaignRef;
    this.attempts = attempts;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.openRate = openRate;
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

  canMoveTo(next: RegionalWaitGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
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

  moveTo(next: RegionalWaitGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional wait group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round(this.quantity * this.attempts * 100) / 100;
  }

  copy(): RegionalWaitGroup {
    return new RegionalWaitGroup(
      this.code,
      this.name,
      this.archived,
      this.tags,
      this.timezone,
      this.campaignRef,
      this.attempts,
      this.ceiling,
      this.quantity,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional wait group in status idle. */
export function newRegionalWaitGroup(code: string, name: string): RegionalWaitGroup {
  return new RegionalWaitGroup(code, name, false, [], "", "", 0, 0, 0, 0, "idle");
}
