/**
 * The sla metric records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a sla metric is in its life cycle. */
export type SlaMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a sla metric and its current status. */
export class SlaMetric {
  code: string;
  label: string;
  limit: number;
  openRate: number;
  tags: string[];
  status: SlaMetricStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    openRate: number,
    tags: string[],
    status: SlaMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.openRate = openRate;
    this.tags = tags;
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

  canMoveTo(next: SlaMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SlaMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedLoad(): number {
    return Math.round((this.openRate + this.limit) * 100) / 100;
  }

  copy(): SlaMetric {
    return new SlaMetric(this.code, this.label, this.limit, this.openRate, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla metric in status open. */
export function newSlaMetric(code: string, label: string): SlaMetric {
  return new SlaMetric(code, label, 0, 0, [], "open");
}
