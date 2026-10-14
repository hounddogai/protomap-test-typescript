import * as text from "../../../../kit/text.js";

/** Where a seasonal exit rule preference is in its life cycle. */
export type SeasonalExitRulePreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal exit rule preference, with what the planners need to act on it. */
export class SeasonalExitRulePreference {
  code: string;
  title: string;
  durationMinutes: number;
  pinned: boolean;
  maximum: number;
  locale: string;
  budget: number;
  campaignRef: string;
  status: SeasonalExitRulePreferenceStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    pinned: boolean,
    maximum: number,
    locale: string,
    budget: number,
    campaignRef: string,
    status: SeasonalExitRulePreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.pinned = pinned;
    this.maximum = maximum;
    this.locale = locale;
    this.budget = budget;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: SeasonalExitRulePreferenceStatus): boolean {
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

  moveTo(next: SeasonalExitRulePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal exit rule preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.durationMinutes * this.budget * 100) / 100;
  }

  copy(): SeasonalExitRulePreference {
    return new SeasonalExitRulePreference(
      this.code,
      this.title,
      this.durationMinutes,
      this.pinned,
      this.maximum,
      this.locale,
      this.budget,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal exit rule preference in status open. */
export function newSeasonalExitRulePreference(code: string, title: string): SeasonalExitRulePreference {
  return new SeasonalExitRulePreference(code, title, 0, false, 0, "", 0, "", "open");
}
