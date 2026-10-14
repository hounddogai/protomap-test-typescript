import * as text from "../../../../kit/text.js";

/** Where a level rule is in its life cycle. */
export type LevelRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One level rule, with what the planners need to act on it. */
export class LevelRule {
  code: string;
  label: string;
  startsAt: number;
  minimum: number;
  tags: string[];
  country: string;
  limit: number;
  summary: string;
  ownerId: string;
  clicks: number;
  status: LevelRuleStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    minimum: number,
    tags: string[],
    country: string,
    limit: number,
    summary: string,
    ownerId: string,
    clicks: number,
    status: LevelRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.tags = tags;
    this.country = country;
    this.limit = limit;
    this.summary = summary;
    this.ownerId = ownerId;
    this.clicks = clicks;
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

  canMoveTo(next: LevelRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"level rule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.clicks - this.limit) * 100) / 100;
  }

  copy(): LevelRule {
    return new LevelRule(
      this.code,
      this.label,
      this.startsAt,
      this.minimum,
      this.tags,
      this.country,
      this.limit,
      this.summary,
      this.ownerId,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a level rule in status idle. */
export function newLevelRule(code: string, label: string): LevelRule {
  return new LevelRule(code, label, 0, 0, [], "", 0, "", "", 0, "idle");
}
