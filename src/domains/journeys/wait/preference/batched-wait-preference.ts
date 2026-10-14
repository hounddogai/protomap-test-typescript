import * as text from "../../../../kit/text.js";

/** Where a batched wait preference is in its life cycle. */
export type BatchedWaitPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One batched wait preference, with what the planners need to act on it. */
export class BatchedWaitPreference {
  code: string;
  title: string;
  country: string;
  active: boolean;
  attributes: Map<string, string>;
  ceiling: number;
  cohort: string;
  channel: string;
  bid: number;
  status: BatchedWaitPreferenceStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    active: boolean,
    attributes: Map<string, string>,
    ceiling: number,
    cohort: string,
    channel: string,
    bid: number,
    status: BatchedWaitPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.active = active;
    this.attributes = attributes;
    this.ceiling = ceiling;
    this.cohort = cohort;
    this.channel = channel;
    this.bid = bid;
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

  canMoveTo(next: BatchedWaitPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedWaitPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched wait preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.ceiling + this.bid) * 100) / 100;
  }

  copy(): BatchedWaitPreference {
    return new BatchedWaitPreference(
      this.code,
      this.title,
      this.country,
      this.active,
      this.attributes,
      this.ceiling,
      this.cohort,
      this.channel,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched wait preference in status idle. */
export function newBatchedWaitPreference(code: string, title: string): BatchedWaitPreference {
  return new BatchedWaitPreference(code, title, "", false, new Map<string, string>(), 0, "", "", 0, "idle");
}
