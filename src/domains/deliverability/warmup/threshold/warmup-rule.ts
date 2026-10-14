import * as text from "../../../../kit/text.js";

/** Where a warmup rule is in its life cycle. */
export type WarmupRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a warmup rule and its current status. */
export class WarmupRule {
  code: string;
  title: string;
  durationMinutes: number;
  windowDays: number;
  startsAt: number;
  revision: number;
  weight: number;
  status: WarmupRuleStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    windowDays: number,
    startsAt: number,
    revision: number,
    weight: number,
    status: WarmupRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.startsAt = startsAt;
    this.revision = revision;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WarmupRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WarmupRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"warmup rule"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision + this.weight) * 100) / 100;
  }

  copy(): WarmupRule {
    return new WarmupRule(
      this.code,
      this.title,
      this.durationMinutes,
      this.windowDays,
      this.startsAt,
      this.revision,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup rule in status proposed. */
export function newWarmupRule(code: string, title: string): WarmupRule {
  return new WarmupRule(code, title, 0, 0, 0, 0, 0, "proposed");
}
