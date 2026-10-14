import * as text from "../../../../kit/text.js";

/** Where a seasonal reward rule is in its life cycle. */
export type SeasonalRewardRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal reward rule. Its code is unique within a tenant. */
export class SeasonalRewardRule {
  code: string;
  title: string;
  timezone: string;
  windowDays: number;
  contactEmail: string;
  journeyId: string;
  weight: number;
  channel: string;
  ownerId: string;
  margin: number;
  expiresAt: number;
  status: SeasonalRewardRuleStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    windowDays: number,
    contactEmail: string,
    journeyId: string,
    weight: number,
    channel: string,
    ownerId: string,
    margin: number,
    expiresAt: number,
    status: SeasonalRewardRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.weight = weight;
    this.channel = channel;
    this.ownerId = ownerId;
    this.margin = margin;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: SeasonalRewardRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalRewardRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round((this.expiresAt + this.margin) * 100) / 100;
  }

  copy(): SeasonalRewardRule {
    return new SeasonalRewardRule(
      this.code,
      this.title,
      this.timezone,
      this.windowDays,
      this.contactEmail,
      this.journeyId,
      this.weight,
      this.channel,
      this.ownerId,
      this.margin,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal reward rule in status idle. */
export function newSeasonalRewardRule(code: string, title: string): SeasonalRewardRule {
  return new SeasonalRewardRule(code, title, "", 0, "", "", 0, "", "", 0, 0, "idle");
}
