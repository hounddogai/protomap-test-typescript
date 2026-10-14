import * as text from "../../../../kit/text.js";

/** Where a seasonal mention schedule is in its life cycle. */
export type SeasonalMentionScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal mention schedule, with what the planners need to act on it. */
export class SeasonalMentionSchedule {
  code: string;
  label: string;
  createdAt: number;
  region: string;
  variant: string;
  frequencyCap: number;
  cost: number;
  category: string;
  title: string;
  locale: string;
  endsAt: number;
  status: SeasonalMentionScheduleStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    region: string,
    variant: string,
    frequencyCap: number,
    cost: number,
    category: string,
    title: string,
    locale: string,
    endsAt: number,
    status: SeasonalMentionScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.region = region;
    this.variant = variant;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.category = category;
    this.title = title;
    this.locale = locale;
    this.endsAt = endsAt;
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

  canMoveTo(next: SeasonalMentionScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
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

  moveTo(next: SeasonalMentionScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal mention schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal mention schedule"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.endsAt * this.cost * 100) / 100;
  }

  copy(): SeasonalMentionSchedule {
    return new SeasonalMentionSchedule(
      this.code,
      this.label,
      this.createdAt,
      this.region,
      this.variant,
      this.frequencyCap,
      this.cost,
      this.category,
      this.title,
      this.locale,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal mention schedule in status idle. */
export function newSeasonalMentionSchedule(code: string, label: string): SeasonalMentionSchedule {
  return new SeasonalMentionSchedule(code, label, 0, "", "", 0, 0, "", "", "", 0, "idle");
}
