import * as text from "../../../../kit/text.js";

/** Where a streak adjustment is in its life cycle. */
export type StreakAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One streak adjustment, with what the planners need to act on it. */
export class StreakAdjustment {
  code: string;
  name: string;
  variant: string;
  attempts: number;
  locale: string;
  campaignRef: string;
  discount: number;
  minimum: number;
  audienceId: string;
  status: StreakAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    attempts: number,
    locale: string,
    campaignRef: string,
    discount: number,
    minimum: number,
    audienceId: string,
    status: StreakAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.attempts = attempts;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.discount = discount;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StreakAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StreakAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.discount - this.attempts) * 100) / 100;
  }

  copy(): StreakAdjustment {
    return new StreakAdjustment(
      this.code,
      this.name,
      this.variant,
      this.attempts,
      this.locale,
      this.campaignRef,
      this.discount,
      this.minimum,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a streak adjustment in status requested. */
export function newStreakAdjustment(code: string, name: string): StreakAdjustment {
  return new StreakAdjustment(code, name, "", 0, "", "", 0, 0, "", "requested");
}
