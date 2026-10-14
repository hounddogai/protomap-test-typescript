import * as text from "../../../../kit/text.js";

/** Where a streak rule is in its life cycle. */
export type StreakRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A streak rule as the streak team keeps it. */
export class StreakRule {
  code: string;
  label: string;
  journeyId: string;
  summary: string;
  source: string;
  margin: number;
  revision: number;
  createdAt: number;
  maximum: number;
  status: StreakRuleStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    summary: string,
    source: string,
    margin: number,
    revision: number,
    createdAt: number,
    maximum: number,
    status: StreakRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.summary = summary;
    this.source = source;
    this.margin = margin;
    this.revision = revision;
    this.createdAt = createdAt;
    this.maximum = maximum;
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

  canMoveTo(next: StreakRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StreakRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.revision - this.createdAt) * 100) / 100;
  }

  copy(): StreakRule {
    return new StreakRule(
      this.code,
      this.label,
      this.journeyId,
      this.summary,
      this.source,
      this.margin,
      this.revision,
      this.createdAt,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a streak rule in status idle. */
export function newStreakRule(code: string, label: string): StreakRule {
  return new StreakRule(code, label, "", "", "", 0, 0, 0, 0, "idle");
}
