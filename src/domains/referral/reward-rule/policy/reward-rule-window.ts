import * as text from "../../../../kit/text.js";

/** Where a reward rule window is in its life cycle. */
export type RewardRuleWindowStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reward rule window, with what the planners need to act on it. */
export class RewardRuleWindow {
  code: string;
  name: string;
  notes: string;
  clicks: number;
  windowDays: number;
  ratio: number;
  externalRef: string;
  cohort: string;
  channel: string;
  source: string;
  region: string;
  status: RewardRuleWindowStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    clicks: number,
    windowDays: number,
    ratio: number,
    externalRef: string,
    cohort: string,
    channel: string,
    source: string,
    region: string,
    status: RewardRuleWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.ratio = ratio;
    this.externalRef = externalRef;
    this.cohort = cohort;
    this.channel = channel;
    this.source = source;
    this.region = region;
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

  canMoveTo(next: RewardRuleWindowStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardRuleWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedVolume(): number {
    return Math.round(this.clicks * this.ratio * 100) / 100;
  }

  copy(): RewardRuleWindow {
    return new RewardRuleWindow(
      this.code,
      this.name,
      this.notes,
      this.clicks,
      this.windowDays,
      this.ratio,
      this.externalRef,
      this.cohort,
      this.channel,
      this.source,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward rule window in status proposed. */
export function newRewardRuleWindow(code: string, name: string): RewardRuleWindow {
  return new RewardRuleWindow(code, name, "", 0, 0, 0, "", "", "", "", "", "proposed");
}
