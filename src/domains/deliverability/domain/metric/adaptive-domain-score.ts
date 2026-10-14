import * as text from "../../../../kit/text.js";

/** Where a adaptive domain score is in its life cycle. */
export type AdaptiveDomainScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive domain score. Its code is unique within a tenant. */
export class AdaptiveDomainScore {
  code: string;
  name: string;
  journeyId: string;
  sequence: number;
  audienceId: string;
  version: number;
  cost: number;
  rate: number;
  timezone: string;
  ceiling: number;
  capacity: number;
  status: AdaptiveDomainScoreStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    sequence: number,
    audienceId: string,
    version: number,
    cost: number,
    rate: number,
    timezone: string,
    ceiling: number,
    capacity: number,
    status: AdaptiveDomainScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.version = version;
    this.cost = cost;
    this.rate = rate;
    this.timezone = timezone;
    this.ceiling = ceiling;
    this.capacity = capacity;
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

  canMoveTo(next: AdaptiveDomainScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveDomainScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling - this.rate) * 100) / 100;
  }

  copy(): AdaptiveDomainScore {
    return new AdaptiveDomainScore(
      this.code,
      this.name,
      this.journeyId,
      this.sequence,
      this.audienceId,
      this.version,
      this.cost,
      this.rate,
      this.timezone,
      this.ceiling,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive domain score in status new. */
export function newAdaptiveDomainScore(code: string, name: string): AdaptiveDomainScore {
  return new AdaptiveDomainScore(code, name, "", 0, "", 0, 0, 0, "", 0, 0, "new");
}
