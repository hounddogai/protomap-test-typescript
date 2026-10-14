/**
 * The insight variance records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight variance is in its life cycle. */
export type InsightVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a insight variance and its current status. */
export class InsightVariance {
  code: string;
  label: string;
  budget: number;
  retries: number;
  channel: string;
  description: string;
  region: string;
  graceDays: number;
  status: InsightVarianceStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    retries: number,
    channel: string,
    description: string,
    region: string,
    graceDays: number,
    status: InsightVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.retries = retries;
    this.channel = channel;
    this.description = description;
    this.region = region;
    this.graceDays = graceDays;
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

  canMoveTo(next: InsightVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: InsightVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"insight variance"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.graceDays * this.budget * 100) / 100;
  }

  copy(): InsightVariance {
    return new InsightVariance(
      this.code,
      this.label,
      this.budget,
      this.retries,
      this.channel,
      this.description,
      this.region,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight variance in status planned. */
export function newInsightVariance(code: string, label: string): InsightVariance {
  return new InsightVariance(code, label, 0, 0, "", "", "", 0, "planned");
}
