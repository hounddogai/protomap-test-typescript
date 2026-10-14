/**
 * The touchpoint metric records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint metric is in its life cycle. */
export type TouchpointMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a touchpoint metric and its current status. */
export class TouchpointMetric {
  code: string;
  title: string;
  pinned: boolean;
  openRate: number;
  budget: number;
  archived: boolean;
  status: TouchpointMetricStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    openRate: number,
    budget: number,
    archived: boolean,
    status: TouchpointMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.openRate = openRate;
    this.budget = budget;
    this.archived = archived;
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

  canMoveTo(next: TouchpointMetricStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: TouchpointMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.openRate * this.budget * 100) / 100;
  }

  copy(): TouchpointMetric {
    return new TouchpointMetric(
      this.code,
      this.title,
      this.pinned,
      this.openRate,
      this.budget,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a touchpoint metric in status open. */
export function newTouchpointMetric(code: string, title: string): TouchpointMetric {
  return new TouchpointMetric(code, title, false, 0, 0, false, "open");
}
