import * as text from "../../../../kit/text.js";

/** Where a adaptive challenge adjustment is in its life cycle. */
export type AdaptiveChallengeAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One adaptive challenge adjustment, with what the planners need to act on it. */
export class AdaptiveChallengeAdjustment {
  code: string;
  title: string;
  graceDays: number;
  sendAt: number;
  amount: number;
  timezone: string;
  quantity: number;
  updatedAt: number;
  maximum: number;
  ownerId: string;
  revision: number;
  status: AdaptiveChallengeAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    sendAt: number,
    amount: number,
    timezone: string,
    quantity: number,
    updatedAt: number,
    maximum: number,
    ownerId: string,
    revision: number,
    status: AdaptiveChallengeAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.amount = amount;
    this.timezone = timezone;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.maximum = maximum;
    this.ownerId = ownerId;
    this.revision = revision;
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

  canMoveTo(next: AdaptiveChallengeAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: AdaptiveChallengeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive challenge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.quantity - this.sendAt) * 100) / 100;
  }

  copy(): AdaptiveChallengeAdjustment {
    return new AdaptiveChallengeAdjustment(
      this.code,
      this.title,
      this.graceDays,
      this.sendAt,
      this.amount,
      this.timezone,
      this.quantity,
      this.updatedAt,
      this.maximum,
      this.ownerId,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive challenge adjustment in status open. */
export function newAdaptiveChallengeAdjustment(code: string, title: string): AdaptiveChallengeAdjustment {
  return new AdaptiveChallengeAdjustment(code, title, 0, 0, 0, "", 0, 0, 0, "", 0, "open");
}
