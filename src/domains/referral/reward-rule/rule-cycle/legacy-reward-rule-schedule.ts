import * as text from "../../../../kit/text.js";

/** Where a legacy reward rule schedule is in its life cycle. */
export type LegacyRewardRuleScheduleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One legacy reward rule schedule, with what the planners need to act on it. */
export class LegacyRewardRuleSchedule {
  code: string;
  title: string;
  capacity: number;
  ratio: number;
  minimum: number;
  channel: string;
  ceiling: number;
  country: string;
  revision: number;
  attempts: number;
  status: LegacyRewardRuleScheduleStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    ratio: number,
    minimum: number,
    channel: string,
    ceiling: number,
    country: string,
    revision: number,
    attempts: number,
    status: LegacyRewardRuleScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.ratio = ratio;
    this.minimum = minimum;
    this.channel = channel;
    this.ceiling = ceiling;
    this.country = country;
    this.revision = revision;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyRewardRuleScheduleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyRewardRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"legacy reward rule schedule"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.ceiling * this.ratio * 100) / 100;
  }

  copy(): LegacyRewardRuleSchedule {
    return new LegacyRewardRuleSchedule(
      this.code,
      this.title,
      this.capacity,
      this.ratio,
      this.minimum,
      this.channel,
      this.ceiling,
      this.country,
      this.revision,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy reward rule schedule in status open. */
export function newLegacyRewardRuleSchedule(code: string, title: string): LegacyRewardRuleSchedule {
  return new LegacyRewardRuleSchedule(code, title, 0, 0, 0, "", 0, "", 0, 0, "open");
}
