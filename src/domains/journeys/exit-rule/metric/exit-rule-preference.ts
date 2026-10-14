import * as text from "../../../../kit/text.js";

/** Where a exit rule preference is in its life cycle. */
export type ExitRulePreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a exit rule preference and its current status. */
export class ExitRulePreference {
  code: string;
  label: string;
  bid: number;
  limit: number;
  reviewer: string;
  utmSource: string;
  externalRef: string;
  durationMinutes: number;
  rate: number;
  score: number;
  cost: number;
  status: ExitRulePreferenceStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    limit: number,
    reviewer: string,
    utmSource: string,
    externalRef: string,
    durationMinutes: number,
    rate: number,
    score: number,
    cost: number,
    status: ExitRulePreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.limit = limit;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.score = score;
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

  canMoveTo(next: ExitRulePreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
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

  moveTo(next: ExitRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.bid + this.durationMinutes) * 100) / 100;
  }

  copy(): ExitRulePreference {
    return new ExitRulePreference(
      this.code,
      this.label,
      this.bid,
      this.limit,
      this.reviewer,
      this.utmSource,
      this.externalRef,
      this.durationMinutes,
      this.rate,
      this.score,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a exit rule preference in status idle. */
export function newExitRulePreference(code: string, label: string): ExitRulePreference {
  return new ExitRulePreference(code, label, 0, 0, "", "", "", 0, 0, 0, 0, "idle");
}
