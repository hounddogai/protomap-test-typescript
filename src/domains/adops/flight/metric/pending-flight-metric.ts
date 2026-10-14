/**
 * The pending flight metric records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending flight metric is in its life cycle. */
export type PendingFlightMetricStatus = "created" | "validated" | "published" | "retired";

/** One pending flight metric, with what the planners need to act on it. */
export class PendingFlightMetric {
  code: string;
  label: string;
  ownerId: string;
  priority: number;
  expiresAt: number;
  locale: string;
  ceiling: number;
  status: PendingFlightMetricStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    priority: number,
    expiresAt: number,
    locale: string,
    ceiling: number,
    status: PendingFlightMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.priority = priority;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingFlightMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingFlightMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending flight metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.priority - this.ceiling) * 100) / 100;
  }

  copy(): PendingFlightMetric {
    return new PendingFlightMetric(
      this.code,
      this.label,
      this.ownerId,
      this.priority,
      this.expiresAt,
      this.locale,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending flight metric in status created. */
export function newPendingFlightMetric(code: string, label: string): PendingFlightMetric {
  return new PendingFlightMetric(code, label, "", 0, 0, "", 0, "created");
}
