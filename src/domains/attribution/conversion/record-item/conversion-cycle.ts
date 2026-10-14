import * as text from "../../../../kit/text.js";

/** Where a conversion cycle is in its life cycle. */
export type ConversionCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A conversion cycle as the conversion team keeps it. */
export class ConversionCycle {
  code: string;
  name: string;
  threshold: number;
  ownerId: string;
  segment: string;
  priority: number;
  country: string;
  rate: number;
  expiresAt: number;
  reviewer: string;
  bid: number;
  status: ConversionCycleStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    ownerId: string,
    segment: string,
    priority: number,
    country: string,
    rate: number,
    expiresAt: number,
    reviewer: string,
    bid: number,
    status: ConversionCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.ownerId = ownerId;
    this.segment = segment;
    this.priority = priority;
    this.country = country;
    this.rate = rate;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.bid = bid;
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

  canMoveTo(next: ConversionCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ConversionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round((this.threshold + this.rate) * 100) / 100;
  }

  copy(): ConversionCycle {
    return new ConversionCycle(
      this.code,
      this.name,
      this.threshold,
      this.ownerId,
      this.segment,
      this.priority,
      this.country,
      this.rate,
      this.expiresAt,
      this.reviewer,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion cycle in status new. */
export function newConversionCycle(code: string, name: string): ConversionCycle {
  return new ConversionCycle(code, name, 0, "", "", 0, "", 0, 0, "", 0, "new");
}
