import * as text from "../../../../kit/text.js";

/** Where a tiered subscription score is in its life cycle. */
export type TieredSubscriptionScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a tiered subscription score and its current status. */
export class TieredSubscriptionScore {
  code: string;
  label: string;
  minimum: number;
  tags: string[];
  journeyId: string;
  checksum: string;
  description: string;
  score: number;
  title: string;
  currency: string;
  ratio: number;
  status: TieredSubscriptionScoreStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    tags: string[],
    journeyId: string,
    checksum: string,
    description: string,
    score: number,
    title: string,
    currency: string,
    ratio: number,
    status: TieredSubscriptionScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.tags = tags;
    this.journeyId = journeyId;
    this.checksum = checksum;
    this.description = description;
    this.score = score;
    this.title = title;
    this.currency = currency;
    this.ratio = ratio;
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

  canMoveTo(next: TieredSubscriptionScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: TieredSubscriptionScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered subscription score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered subscription score"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.ratio + this.score) * 100) / 100;
  }

  copy(): TieredSubscriptionScore {
    return new TieredSubscriptionScore(
      this.code,
      this.label,
      this.minimum,
      this.tags,
      this.journeyId,
      this.checksum,
      this.description,
      this.score,
      this.title,
      this.currency,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered subscription score in status idle. */
export function newTieredSubscriptionScore(code: string, label: string): TieredSubscriptionScore {
  return new TieredSubscriptionScore(code, label, 0, [], "", "", "", 0, "", "", 0, "idle");
}
