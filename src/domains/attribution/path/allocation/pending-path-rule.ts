import * as text from "../../../../kit/text.js";

/** Where a pending path rule is in its life cycle. */
export type PendingPathRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending path rule, with what the planners need to act on it. */
export class PendingPathRule {
  code: string;
  title: string;
  utmSource: string;
  externalRef: string;
  durationMinutes: number;
  attempts: number;
  country: string;
  notes: string;
  status: PendingPathRuleStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    externalRef: string,
    durationMinutes: number,
    attempts: number,
    country: string,
    notes: string,
    status: PendingPathRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.externalRef = externalRef;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.country = country;
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

  canMoveTo(next: PendingPathRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingPathRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending path rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending path rule"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.attempts * this.durationMinutes * 100) / 100;
  }

  copy(): PendingPathRule {
    return new PendingPathRule(
      this.code,
      this.title,
      this.utmSource,
      this.externalRef,
      this.durationMinutes,
      this.attempts,
      this.country,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending path rule in status idle. */
export function newPendingPathRule(code: string, title: string): PendingPathRule {
  return new PendingPathRule(code, title, "", "", 0, 0, "", "", "idle");
}
