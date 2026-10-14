import * as text from "../../../../kit/text.js";

/** Where a adaptive reward rule summary is in its life cycle. */
export type AdaptiveRewardRuleSummaryStatus = "created" | "validated" | "published" | "retired";

/** A adaptive reward rule summary as the reward rule team keeps it. */
export class AdaptiveRewardRuleSummary {
  code: string;
  name: string;
  expiresAt: number;
  sequence: number;
  timezone: string;
  attempts: number;
  maximum: number;
  phone: string;
  status: AdaptiveRewardRuleSummaryStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    sequence: number,
    timezone: string,
    attempts: number,
    maximum: number,
    phone: string,
    status: AdaptiveRewardRuleSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.timezone = timezone;
    this.attempts = attempts;
    this.maximum = maximum;
    this.phone = phone;
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

  canMoveTo(next: AdaptiveRewardRuleSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveRewardRuleSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reward rule summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum - this.sequence) * 100) / 100;
  }

  copy(): AdaptiveRewardRuleSummary {
    return new AdaptiveRewardRuleSummary(
      this.code,
      this.name,
      this.expiresAt,
      this.sequence,
      this.timezone,
      this.attempts,
      this.maximum,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive reward rule summary in status created. */
export function newAdaptiveRewardRuleSummary(code: string, name: string): AdaptiveRewardRuleSummary {
  return new AdaptiveRewardRuleSummary(code, name, 0, 0, "", 0, 0, "", "created");
}
