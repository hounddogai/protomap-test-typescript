import * as text from "../../../../kit/text.js";

/** Where a weighted deflection rule is in its life cycle. */
export type WeightedDeflectionRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One weighted deflection rule, with what the planners need to act on it. */
export class WeightedDeflectionRule {
  code: string;
  name: string;
  region: string;
  limit: number;
  revision: number;
  updatedAt: number;
  source: string;
  active: boolean;
  clicks: number;
  status: WeightedDeflectionRuleStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    limit: number,
    revision: number,
    updatedAt: number,
    source: string,
    active: boolean,
    clicks: number,
    status: WeightedDeflectionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.limit = limit;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.source = source;
    this.active = active;
    this.clicks = clicks;
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

  canMoveTo(next: WeightedDeflectionRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
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

  moveTo(next: WeightedDeflectionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted deflection rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks - this.updatedAt) * 100) / 100;
  }

  copy(): WeightedDeflectionRule {
    return new WeightedDeflectionRule(
      this.code,
      this.name,
      this.region,
      this.limit,
      this.revision,
      this.updatedAt,
      this.source,
      this.active,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted deflection rule in status idle. */
export function newWeightedDeflectionRule(code: string, name: string): WeightedDeflectionRule {
  return new WeightedDeflectionRule(code, name, "", 0, 0, 0, "", false, 0, "idle");
}
