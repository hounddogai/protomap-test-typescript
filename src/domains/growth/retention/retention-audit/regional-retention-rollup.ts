import * as text from "../../../../kit/text.js";

/** Where a regional retention rollup is in its life cycle. */
export type RegionalRetentionRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional retention rollup as the retention team keeps it. */
export class RegionalRetentionRollup {
  code: string;
  title: string;
  description: string;
  tags: string[];
  sendAt: number;
  bid: number;
  summary: string;
  quantity: number;
  score: number;
  segment: string;
  attributes: Map<string, string>;
  status: RegionalRetentionRollupStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    tags: string[],
    sendAt: number,
    bid: number,
    summary: string,
    quantity: number,
    score: number,
    segment: string,
    attributes: Map<string, string>,
    status: RegionalRetentionRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.tags = tags;
    this.sendAt = sendAt;
    this.bid = bid;
    this.summary = summary;
    this.quantity = quantity;
    this.score = score;
    this.segment = segment;
    this.attributes = attributes;
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

  canMoveTo(next: RegionalRetentionRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalRetentionRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional retention rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional retention rollup"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.bid + this.score) * 100) / 100;
  }

  copy(): RegionalRetentionRollup {
    return new RegionalRetentionRollup(
      this.code,
      this.title,
      this.description,
      this.tags,
      this.sendAt,
      this.bid,
      this.summary,
      this.quantity,
      this.score,
      this.segment,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a regional retention rollup in status idle. */
export function newRegionalRetentionRollup(code: string, title: string): RegionalRetentionRollup {
  return new RegionalRetentionRollup(code, title, "", [], 0, 0, "", 0, 0, "", new Map<string, string>(), "idle");
}
