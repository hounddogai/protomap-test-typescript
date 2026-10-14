import * as text from "../../../../kit/text.js";

/** Where a warmup allocation is in its life cycle. */
export type WarmupAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a warmup allocation and its current status. */
export class WarmupAllocation {
  code: string;
  label: string;
  contactEmail: string;
  ratio: number;
  rate: number;
  startsAt: number;
  threshold: number;
  currency: string;
  status: WarmupAllocationStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    ratio: number,
    rate: number,
    startsAt: number,
    threshold: number,
    currency: string,
    status: WarmupAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.rate = rate;
    this.startsAt = startsAt;
    this.threshold = threshold;
    this.currency = currency;
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

  canMoveTo(next: WarmupAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WarmupAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.ratio + this.rate) * 100) / 100;
  }

  copy(): WarmupAllocation {
    return new WarmupAllocation(
      this.code,
      this.label,
      this.contactEmail,
      this.ratio,
      this.rate,
      this.startsAt,
      this.threshold,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a warmup allocation in status new. */
export function newWarmupAllocation(code: string, label: string): WarmupAllocation {
  return new WarmupAllocation(code, label, "", 0, 0, 0, 0, "", "new");
}
