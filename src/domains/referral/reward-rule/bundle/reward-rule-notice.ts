import * as text from "../../../../kit/text.js";

/** Where a reward rule notice is in its life cycle. */
export type RewardRuleNoticeStatus = "created" | "validated" | "published" | "retired";

/** A reward rule notice. Its code is unique within a tenant. */
export class RewardRuleNotice {
  code: string;
  name: string;
  locale: string;
  durationMinutes: number;
  utmSource: string;
  channel: string;
  weight: number;
  region: string;
  status: RewardRuleNoticeStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    durationMinutes: number,
    utmSource: string,
    channel: string,
    weight: number,
    region: string,
    status: RewardRuleNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
    this.channel = channel;
    this.weight = weight;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardRuleNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardRuleNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.weight + this.durationMinutes) * 100) / 100;
  }

  copy(): RewardRuleNotice {
    return new RewardRuleNotice(
      this.code,
      this.name,
      this.locale,
      this.durationMinutes,
      this.utmSource,
      this.channel,
      this.weight,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reward rule notice in status created. */
export function newRewardRuleNotice(code: string, name: string): RewardRuleNotice {
  return new RewardRuleNotice(code, name, "", 0, "", "", 0, "", "created");
}
