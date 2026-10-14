/**
 * The insight metric records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight metric is in its life cycle. */
export type InsightMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A insight metric. Its code is unique within a tenant. */
export class InsightMetric {
  code: string;
  name: string;
  batchSize: number;
  category: string;
  graceDays: number;
  createdAt: number;
  weight: number;
  country: string;
  retries: number;
  budget: number;
  channel: string;
  status: InsightMetricStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    category: string,
    graceDays: number,
    createdAt: number,
    weight: number,
    country: string,
    retries: number,
    budget: number,
    channel: string,
    status: InsightMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.category = category;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.weight = weight;
    this.country = country;
    this.retries = retries;
    this.budget = budget;
    this.channel = channel;
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

  canMoveTo(next: InsightMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.createdAt - this.weight) * 100) / 100;
  }

  copy(): InsightMetric {
    return new InsightMetric(
      this.code,
      this.name,
      this.batchSize,
      this.category,
      this.graceDays,
      this.createdAt,
      this.weight,
      this.country,
      this.retries,
      this.budget,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a insight metric in status open. */
export function newInsightMetric(code: string, name: string): InsightMetric {
  return new InsightMetric(code, name, 0, "", 0, 0, 0, "", 0, 0, "", "open");
}
