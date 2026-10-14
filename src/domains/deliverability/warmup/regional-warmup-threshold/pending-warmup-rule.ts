import * as text from "../../../../kit/text.js";

/** Where a pending warmup rule is in its life cycle. */
export type PendingWarmupRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending warmup rule as the warmup team keeps it. */
export class PendingWarmupRule {
  code: string;
  name: string;
  ceiling: number;
  frequencyCap: number;
  expiresAt: number;
  score: number;
  endsAt: number;
  channel: string;
  margin: number;
  cost: number;
  status: PendingWarmupRuleStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    frequencyCap: number,
    expiresAt: number,
    score: number,
    endsAt: number,
    channel: string,
    margin: number,
    cost: number,
    status: PendingWarmupRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.score = score;
    this.endsAt = endsAt;
    this.channel = channel;
    this.margin = margin;
    this.cost = cost;
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

  canMoveTo(next: PendingWarmupRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: PendingWarmupRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending warmup rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round(this.frequencyCap * this.score * 100) / 100;
  }

  copy(): PendingWarmupRule {
    return new PendingWarmupRule(
      this.code,
      this.name,
      this.ceiling,
      this.frequencyCap,
      this.expiresAt,
      this.score,
      this.endsAt,
      this.channel,
      this.margin,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending warmup rule in status idle. */
export function newPendingWarmupRule(code: string, name: string): PendingWarmupRule {
  return new PendingWarmupRule(code, name, 0, 0, 0, 0, 0, "", 0, 0, "idle");
}
