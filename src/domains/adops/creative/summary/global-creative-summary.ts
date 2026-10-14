import * as text from "../../../../kit/text.js";

/** Where a global creative summary is in its life cycle. */
export type GlobalCreativeSummaryStatus = "requested" | "granted" | "revoked" | "expired";

/** A global creative summary. Its code is unique within a tenant. */
export class GlobalCreativeSummary {
  code: string;
  label: string;
  cost: number;
  tags: string[];
  startsAt: number;
  durationMinutes: number;
  reviewer: string;
  budget: number;
  region: string;
  discount: number;
  status: GlobalCreativeSummaryStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    tags: string[],
    startsAt: number,
    durationMinutes: number,
    reviewer: string,
    budget: number,
    region: string,
    discount: number,
    status: GlobalCreativeSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.tags = tags;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.reviewer = reviewer;
    this.budget = budget;
    this.region = region;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalCreativeSummaryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalCreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.discount + this.cost) * 100) / 100;
  }

  copy(): GlobalCreativeSummary {
    return new GlobalCreativeSummary(
      this.code,
      this.label,
      this.cost,
      this.tags,
      this.startsAt,
      this.durationMinutes,
      this.reviewer,
      this.budget,
      this.region,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global creative summary in status requested. */
export function newGlobalCreativeSummary(code: string, label: string): GlobalCreativeSummary {
  return new GlobalCreativeSummary(code, label, 0, [], 0, 0, "", 0, "", 0, "requested");
}
