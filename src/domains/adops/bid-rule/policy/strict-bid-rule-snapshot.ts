import * as text from "../../../../kit/text.js";

/** Where a strict bid rule snapshot is in its life cycle. */
export type StrictBidRuleSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One strict bid rule snapshot, with what the planners need to act on it. */
export class StrictBidRuleSnapshot {
  code: string;
  title: string;
  threshold: number;
  bid: number;
  attributes: Map<string, string>;
  timezone: string;
  rate: number;
  windowDays: number;
  status: StrictBidRuleSnapshotStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    bid: number,
    attributes: Map<string, string>,
    timezone: string,
    rate: number,
    windowDays: number,
    status: StrictBidRuleSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.bid = bid;
    this.attributes = attributes;
    this.timezone = timezone;
    this.rate = rate;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictBidRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictBidRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict bid rule snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round(this.windowDays * this.rate * 100) / 100;
  }

  copy(): StrictBidRuleSnapshot {
    return new StrictBidRuleSnapshot(
      this.code,
      this.title,
      this.threshold,
      this.bid,
      this.attributes,
      this.timezone,
      this.rate,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict bid rule snapshot in status planned. */
export function newStrictBidRuleSnapshot(code: string, title: string): StrictBidRuleSnapshot {
  return new StrictBidRuleSnapshot(code, title, 0, 0, new Map<string, string>(), "", 0, 0, "planned");
}
