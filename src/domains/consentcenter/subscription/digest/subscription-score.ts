import * as text from "../../../../kit/text.js";

/** Where a subscription score is in its life cycle. */
export type SubscriptionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One subscription score, with what the planners need to act on it. */
export class SubscriptionScore {
  code: string;
  label: string;
  bid: number;
  variant: string;
  score: number;
  audienceId: string;
  quantity: number;
  openRate: number;
  tags: string[];
  channel: string;
  status: SubscriptionScoreStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    variant: string,
    score: number,
    audienceId: string,
    quantity: number,
    openRate: number,
    tags: string[],
    channel: string,
    status: SubscriptionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.variant = variant;
    this.score = score;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.openRate = openRate;
    this.tags = tags;
    this.channel = channel;
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

  canMoveTo(next: SubscriptionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round((this.quantity - this.openRate) * 100) / 100;
  }

  copy(): SubscriptionScore {
    return new SubscriptionScore(
      this.code,
      this.label,
      this.bid,
      this.variant,
      this.score,
      this.audienceId,
      this.quantity,
      this.openRate,
      this.tags,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a subscription score in status idle. */
export function newSubscriptionScore(code: string, label: string): SubscriptionScore {
  return new SubscriptionScore(code, label, 0, "", 0, "", 0, 0, [], "", "idle");
}
