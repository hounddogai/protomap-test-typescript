/**
 * The seasonal warmup rule records of deliverability's warmup work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup rule is in its life cycle. */
export type SeasonalWarmupRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal warmup rule, with what the planners need to act on it. */
export class SeasonalWarmupRule {
  code: string;
  label: string;
  margin: number;
  channel: string;
  durationMinutes: number;
  cost: number;
  bid: number;
  limit: number;
  notes: string;
  status: SeasonalWarmupRuleStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    channel: string,
    durationMinutes: number,
    cost: number,
    bid: number,
    limit: number,
    notes: string,
    status: SeasonalWarmupRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.channel = channel;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
    this.bid = bid;
    this.limit = limit;
    this.notes = notes;
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

  canMoveTo(next: SeasonalWarmupRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalWarmupRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.limit - this.margin) * 100) / 100;
  }

  copy(): SeasonalWarmupRule {
    return new SeasonalWarmupRule(
      this.code,
      this.label,
      this.margin,
      this.channel,
      this.durationMinutes,
      this.cost,
      this.bid,
      this.limit,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal warmup rule in status idle. */
export function newSeasonalWarmupRule(code: string, label: string): SeasonalWarmupRule {
  return new SeasonalWarmupRule(code, label, 0, "", 0, 0, 0, 0, "", "idle");
}
