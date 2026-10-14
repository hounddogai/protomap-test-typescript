import * as text from "../../../../kit/text.js";

/** Where a global insight segment is in its life cycle. */
export type GlobalInsightSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A global insight segment. Its code is unique within a tenant. */
export class GlobalInsightSegment {
  code: string;
  label: string;
  currency: string;
  region: string;
  source: string;
  active: boolean;
  expiresAt: number;
  cost: number;
  status: GlobalInsightSegmentStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    region: string,
    source: string,
    active: boolean,
    expiresAt: number,
    cost: number,
    status: GlobalInsightSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.region = region;
    this.source = source;
    this.active = active;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalInsightSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalInsightSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global insight segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netValue(): number {
    return Math.round((this.cost + this.expiresAt) * 100) / 100;
  }

  copy(): GlobalInsightSegment {
    return new GlobalInsightSegment(
      this.code,
      this.label,
      this.currency,
      this.region,
      this.source,
      this.active,
      this.expiresAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a global insight segment in status open. */
export function newGlobalInsightSegment(code: string, label: string): GlobalInsightSegment {
  return new GlobalInsightSegment(code, label, "", "", "", false, 0, 0, "open");
}
