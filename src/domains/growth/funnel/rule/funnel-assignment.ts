import * as text from "../../../../kit/text.js";

/** Where a funnel assignment is in its life cycle. */
export type FunnelAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a funnel assignment and its current status. */
export class FunnelAssignment {
  code: string;
  title: string;
  updatedAt: number;
  budget: number;
  campaignRef: string;
  currency: string;
  attributes: Map<string, string>;
  country: string;
  floorValue: number;
  reviewer: string;
  threshold: number;
  status: FunnelAssignmentStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    budget: number,
    campaignRef: string,
    currency: string,
    attributes: Map<string, string>,
    country: string,
    floorValue: number,
    reviewer: string,
    threshold: number,
    status: FunnelAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.campaignRef = campaignRef;
    this.currency = currency;
    this.attributes = attributes;
    this.country = country;
    this.floorValue = floorValue;
    this.reviewer = reviewer;
    this.threshold = threshold;
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

  canMoveTo(next: FunnelAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FunnelAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.updatedAt + this.threshold) * 100) / 100;
  }

  copy(): FunnelAssignment {
    return new FunnelAssignment(
      this.code,
      this.title,
      this.updatedAt,
      this.budget,
      this.campaignRef,
      this.currency,
      this.attributes,
      this.country,
      this.floorValue,
      this.reviewer,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a funnel assignment in status idle. */
export function newFunnelAssignment(code: string, title: string): FunnelAssignment {
  return new FunnelAssignment(code, title, 0, 0, "", "", new Map<string, string>(), "", 0, "", 0, "idle");
}
