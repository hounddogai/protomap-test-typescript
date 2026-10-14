import * as text from "../../../../kit/text.js";

/** Where a bid rule score is in its life cycle. */
export type BidRuleScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A bid rule score. Its code is unique within a tenant. */
export class BidRuleScore {
  code: string;
  title: string;
  locale: string;
  segment: string;
  region: string;
  visible: boolean;
  label: string;
  summary: string;
  score: number;
  status: BidRuleScoreStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    segment: string,
    region: string,
    visible: boolean,
    label: string,
    summary: string,
    score: number,
    status: BidRuleScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.segment = segment;
    this.region = region;
    this.visible = visible;
    this.label = label;
    this.summary = summary;
    this.score = score;
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

  canMoveTo(next: BidRuleScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BidRuleScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bid rule score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): BidRuleScore {
    return new BidRuleScore(
      this.code,
      this.title,
      this.locale,
      this.segment,
      this.region,
      this.visible,
      this.label,
      this.summary,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bid rule score in status idle. */
export function newBidRuleScore(code: string, title: string): BidRuleScore {
  return new BidRuleScore(code, title, "", "", "", false, "", "", 0, "idle");
}
