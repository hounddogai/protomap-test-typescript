import * as text from "../../../../kit/text.js";

/** Where a batched journey policy is in its life cycle. */
export type BatchedJourneyPolicyStatus = "created" | "validated" | "published" | "retired";

/** One batched journey policy, with what the planners need to act on it. */
export class BatchedJourneyPolicy {
  code: string;
  title: string;
  channel: string;
  batchSize: number;
  threshold: number;
  conversionRate: number;
  attributes: Map<string, string>;
  rate: number;
  utmSource: string;
  pinned: boolean;
  status: BatchedJourneyPolicyStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    batchSize: number,
    threshold: number,
    conversionRate: number,
    attributes: Map<string, string>,
    rate: number,
    utmSource: string,
    pinned: boolean,
    status: BatchedJourneyPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.attributes = attributes;
    this.rate = rate;
    this.utmSource = utmSource;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedJourneyPolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedJourneyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey policy ${this.code} cannot move from ${this.status} to ${next}`);
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

  weightedExposure(): number {
    return Math.round(this.batchSize * this.threshold * 100) / 100;
  }

  copy(): BatchedJourneyPolicy {
    return new BatchedJourneyPolicy(
      this.code,
      this.title,
      this.channel,
      this.batchSize,
      this.threshold,
      this.conversionRate,
      this.attributes,
      this.rate,
      this.utmSource,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched journey policy in status created. */
export function newBatchedJourneyPolicy(code: string, title: string): BatchedJourneyPolicy {
  return new BatchedJourneyPolicy(code, title, "", 0, 0, 0, new Map<string, string>(), 0, "", false, "created");
}
