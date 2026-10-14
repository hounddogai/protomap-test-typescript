import * as text from "../../../../kit/text.js";

/** Where a challenge rule is in its life cycle. */
export type ChallengeRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A challenge rule as the challenge team keeps it. */
export class ChallengeRule {
  code: string;
  label: string;
  locale: string;
  batchSize: number;
  unit: string;
  tags: string[];
  discount: number;
  score: number;
  status: ChallengeRuleStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    batchSize: number,
    unit: string,
    tags: string[],
    discount: number,
    score: number,
    status: ChallengeRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.batchSize = batchSize;
    this.unit = unit;
    this.tags = tags;
    this.discount = discount;
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

  canMoveTo(next: ChallengeRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge rule ${this.code} cannot move from ${this.status} to ${next}`);
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

  adjustedExposure(): number {
    return Math.round((this.score - this.discount) * 100) / 100;
  }

  copy(): ChallengeRule {
    return new ChallengeRule(
      this.code,
      this.label,
      this.locale,
      this.batchSize,
      this.unit,
      this.tags,
      this.discount,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a challenge rule in status idle. */
export function newChallengeRule(code: string, label: string): ChallengeRule {
  return new ChallengeRule(code, label, "", 0, "", [], 0, 0, "idle");
}
