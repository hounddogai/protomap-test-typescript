import * as text from "../../../../kit/text.js";

/** Where a fallback journey summary is in its life cycle. */
export type FallbackJourneySummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback journey summary. Its code is unique within a tenant. */
export class FallbackJourneySummary {
  code: string;
  name: string;
  tags: string[];
  cost: number;
  cohort: string;
  amount: number;
  sendAt: number;
  status: FallbackJourneySummaryStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    cost: number,
    cohort: string,
    amount: number,
    sendAt: number,
    status: FallbackJourneySummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.cost = cost;
    this.cohort = cohort;
    this.amount = amount;
    this.sendAt = sendAt;
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

  canMoveTo(next: FallbackJourneySummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackJourneySummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback journey summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.sendAt * this.cost * 100) / 100;
  }

  copy(): FallbackJourneySummary {
    return new FallbackJourneySummary(
      this.code,
      this.name,
      this.tags,
      this.cost,
      this.cohort,
      this.amount,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback journey summary in status idle. */
export function newFallbackJourneySummary(code: string, name: string): FallbackJourneySummary {
  return new FallbackJourneySummary(code, name, [], 0, "", 0, 0, "idle");
}
