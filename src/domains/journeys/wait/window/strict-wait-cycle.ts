import * as text from "../../../../kit/text.js";

/** Where a strict wait cycle is in its life cycle. */
export type StrictWaitCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict wait cycle, with what the planners need to act on it. */
export class StrictWaitCycle {
  code: string;
  label: string;
  segment: string;
  category: string;
  region: string;
  bid: number;
  attributes: Map<string, string>;
  rate: number;
  reviewer: string;
  channel: string;
  status: StrictWaitCycleStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    category: string,
    region: string,
    bid: number,
    attributes: Map<string, string>,
    rate: number,
    reviewer: string,
    channel: string,
    status: StrictWaitCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.category = category;
    this.region = region;
    this.bid = bid;
    this.attributes = attributes;
    this.rate = rate;
    this.reviewer = reviewer;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictWaitCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictWaitCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict wait cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.bid + this.rate) * 100) / 100;
  }

  copy(): StrictWaitCycle {
    return new StrictWaitCycle(
      this.code,
      this.label,
      this.segment,
      this.category,
      this.region,
      this.bid,
      this.attributes,
      this.rate,
      this.reviewer,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a strict wait cycle in status new. */
export function newStrictWaitCycle(code: string, label: string): StrictWaitCycle {
  return new StrictWaitCycle(code, label, "", "", "", 0, new Map<string, string>(), 0, "", "", "new");
}
