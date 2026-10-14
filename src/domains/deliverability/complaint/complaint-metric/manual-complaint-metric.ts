/**
 * The manual complaint metric records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual complaint metric is in its life cycle. */
export type ManualComplaintMetricStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual complaint metric, with what the planners need to act on it. */
export class ManualComplaintMetric {
  code: string;
  title: string;
  pinned: boolean;
  priority: number;
  category: string;
  utmSource: string;
  journeyId: string;
  status: ManualComplaintMetricStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    priority: number,
    category: string,
    utmSource: string,
    journeyId: string,
    status: ManualComplaintMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.priority = priority;
    this.category = category;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualComplaintMetricStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualComplaintMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual complaint metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): ManualComplaintMetric {
    return new ManualComplaintMetric(
      this.code,
      this.title,
      this.pinned,
      this.priority,
      this.category,
      this.utmSource,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual complaint metric in status draft. */
export function newManualComplaintMetric(code: string, title: string): ManualComplaintMetric {
  return new ManualComplaintMetric(code, title, false, 0, "", "", "", "draft");
}
