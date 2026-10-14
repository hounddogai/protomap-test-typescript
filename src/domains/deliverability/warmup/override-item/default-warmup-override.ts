/**
 * The default warmup override records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default warmup override is in its life cycle. */
export type DefaultWarmupOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default warmup override as the warmup team keeps it. */
export class DefaultWarmupOverride {
  code: string;
  name: string;
  country: string;
  budget: number;
  ceiling: number;
  retries: number;
  clicks: number;
  status: DefaultWarmupOverrideStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    budget: number,
    ceiling: number,
    retries: number,
    clicks: number,
    status: DefaultWarmupOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.budget = budget;
    this.ceiling = ceiling;
    this.retries = retries;
    this.clicks = clicks;
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

  canMoveTo(next: DefaultWarmupOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: DefaultWarmupOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round(this.clicks * this.ceiling * 100) / 100;
  }

  copy(): DefaultWarmupOverride {
    return new DefaultWarmupOverride(
      this.code,
      this.name,
      this.country,
      this.budget,
      this.ceiling,
      this.retries,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a default warmup override in status planned. */
export function newDefaultWarmupOverride(code: string, name: string): DefaultWarmupOverride {
  return new DefaultWarmupOverride(code, name, "", 0, 0, 0, 0, "planned");
}
