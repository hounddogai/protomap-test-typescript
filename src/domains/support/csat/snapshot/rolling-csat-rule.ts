import * as text from "../../../../kit/text.js";

/** Where a rolling csat rule is in its life cycle. */
export type RollingCsatRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling csat rule as the csat team keeps it. */
export class RollingCsatRule {
  code: string;
  name: string;
  variant: string;
  unit: string;
  openRate: number;
  source: string;
  tags: string[];
  summary: string;
  cost: number;
  floorValue: number;
  status: RollingCsatRuleStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    unit: string,
    openRate: number,
    source: string,
    tags: string[],
    summary: string,
    cost: number,
    floorValue: number,
    status: RollingCsatRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.unit = unit;
    this.openRate = openRate;
    this.source = source;
    this.tags = tags;
    this.summary = summary;
    this.cost = cost;
    this.floorValue = floorValue;
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

  canMoveTo(next: RollingCsatRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingCsatRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling csat rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling csat rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round((this.floorValue - this.cost) * 100) / 100;
  }

  copy(): RollingCsatRule {
    return new RollingCsatRule(
      this.code,
      this.name,
      this.variant,
      this.unit,
      this.openRate,
      this.source,
      this.tags,
      this.summary,
      this.cost,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling csat rule in status idle. */
export function newRollingCsatRule(code: string, name: string): RollingCsatRule {
  return new RollingCsatRule(code, name, "", "", 0, "", [], "", 0, 0, "idle");
}
