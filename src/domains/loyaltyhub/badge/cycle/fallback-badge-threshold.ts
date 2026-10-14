import * as text from "../../../../kit/text.js";

/** Where a fallback badge threshold is in its life cycle. */
export type FallbackBadgeThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback badge threshold. Its code is unique within a tenant. */
export class FallbackBadgeThreshold {
  code: string;
  title: string;
  country: string;
  cost: number;
  limit: number;
  segment: string;
  category: string;
  region: string;
  status: FallbackBadgeThresholdStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    cost: number,
    limit: number,
    segment: string,
    category: string,
    region: string,
    status: FallbackBadgeThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.cost = cost;
    this.limit = limit;
    this.segment = segment;
    this.category = category;
    this.region = region;
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

  canMoveTo(next: FallbackBadgeThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
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

  moveTo(next: FallbackBadgeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback badge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.cost + this.limit) * 100) / 100;
  }

  copy(): FallbackBadgeThreshold {
    return new FallbackBadgeThreshold(
      this.code,
      this.title,
      this.country,
      this.cost,
      this.limit,
      this.segment,
      this.category,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback badge threshold in status new. */
export function newFallbackBadgeThreshold(code: string, title: string): FallbackBadgeThreshold {
  return new FallbackBadgeThreshold(code, title, "", 0, 0, "", "", "", "new");
}
