import * as text from "../../../../kit/text.js";

/** Where a lenient tier mapping is in its life cycle. */
export type LenientTierMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient tier mapping as the tier team keeps it. */
export class LenientTierMapping {
  code: string;
  title: string;
  createdAt: number;
  clicks: number;
  capacity: number;
  threshold: number;
  status: LenientTierMappingStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    clicks: number,
    capacity: number,
    threshold: number,
    status: LenientTierMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.clicks = clicks;
    this.capacity = capacity;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientTierMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientTierMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient tier mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.clicks - this.capacity) * 100) / 100;
  }

  copy(): LenientTierMapping {
    return new LenientTierMapping(
      this.code,
      this.title,
      this.createdAt,
      this.clicks,
      this.capacity,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient tier mapping in status proposed. */
export function newLenientTierMapping(code: string, title: string): LenientTierMapping {
  return new LenientTierMapping(code, title, 0, 0, 0, 0, "proposed");
}
