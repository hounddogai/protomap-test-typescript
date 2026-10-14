import * as text from "../../../../kit/text.js";

/** Where a fallback reputation batch is in its life cycle. */
export type FallbackReputationBatchStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a fallback reputation batch and its current status. */
export class FallbackReputationBatch {
  code: string;
  title: string;
  version: number;
  country: string;
  capacity: number;
  channel: string;
  segment: string;
  retries: number;
  status: FallbackReputationBatchStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    country: string,
    capacity: number,
    channel: string,
    segment: string,
    retries: number,
    status: FallbackReputationBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.country = country;
    this.capacity = capacity;
    this.channel = channel;
    this.segment = segment;
    this.retries = retries;
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

  canMoveTo(next: FallbackReputationBatchStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackReputationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reputation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.capacity + this.version) * 100) / 100;
  }

  copy(): FallbackReputationBatch {
    return new FallbackReputationBatch(
      this.code,
      this.title,
      this.version,
      this.country,
      this.capacity,
      this.channel,
      this.segment,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback reputation batch in status planned. */
export function newFallbackReputationBatch(code: string, title: string): FallbackReputationBatch {
  return new FallbackReputationBatch(code, title, 0, "", 0, "", "", 0, "planned");
}
