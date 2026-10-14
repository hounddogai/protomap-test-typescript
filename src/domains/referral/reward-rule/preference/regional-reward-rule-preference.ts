import * as text from "../../../../kit/text.js";

/** Where a regional reward rule preference is in its life cycle. */
export type RegionalRewardRulePreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional reward rule preference. Its code is unique within a tenant. */
export class RegionalRewardRulePreference {
  code: string;
  title: string;
  ratio: number;
  durationMinutes: number;
  windowDays: number;
  channel: string;
  status: RegionalRewardRulePreferenceStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    durationMinutes: number,
    windowDays: number,
    channel: string,
    status: RegionalRewardRulePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.channel = channel;
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

  canMoveTo(next: RegionalRewardRulePreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalRewardRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reward rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.ratio * this.windowDays * 100) / 100;
  }

  copy(): RegionalRewardRulePreference {
    return new RegionalRewardRulePreference(
      this.code,
      this.title,
      this.ratio,
      this.durationMinutes,
      this.windowDays,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional reward rule preference in status open. */
export function newRegionalRewardRulePreference(code: string, title: string): RegionalRewardRulePreference {
  return new RegionalRewardRulePreference(code, title, 0, 0, 0, "", "open");
}
