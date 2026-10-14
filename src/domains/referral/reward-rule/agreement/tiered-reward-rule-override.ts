import * as text from "../../../../kit/text.js";

/** Where a tiered reward rule override is in its life cycle. */
export type TieredRewardRuleOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered reward rule override. Its code is unique within a tenant. */
export class TieredRewardRuleOverride {
  code: string;
  label: string;
  margin: number;
  frequencyCap: number;
  timezone: string;
  source: string;
  ownerId: string;
  durationMinutes: number;
  variant: string;
  status: TieredRewardRuleOverrideStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    frequencyCap: number,
    timezone: string,
    source: string,
    ownerId: string,
    durationMinutes: number,
    variant: string,
    status: TieredRewardRuleOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
    this.source = source;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
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

  canMoveTo(next: TieredRewardRuleOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredRewardRuleOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward rule override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.frequencyCap * this.margin * 100) / 100;
  }

  copy(): TieredRewardRuleOverride {
    return new TieredRewardRuleOverride(
      this.code,
      this.label,
      this.margin,
      this.frequencyCap,
      this.timezone,
      this.source,
      this.ownerId,
      this.durationMinutes,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered reward rule override in status idle. */
export function newTieredRewardRuleOverride(code: string, label: string): TieredRewardRuleOverride {
  return new TieredRewardRuleOverride(code, label, 0, 0, "", "", "", 0, "", "idle");
}
