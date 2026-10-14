/**
 * The strict queue metric records of social's queue work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict queue metric is in its life cycle. */
export type StrictQueueMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict queue metric, with what the planners need to act on it. */
export class StrictQueueMetric {
  code: string;
  label: string;
  sequence: number;
  frequencyCap: number;
  updatedAt: number;
  durationMinutes: number;
  cohort: string;
  channel: string;
  ownerId: string;
  status: StrictQueueMetricStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    frequencyCap: number,
    updatedAt: number,
    durationMinutes: number,
    cohort: string,
    channel: string,
    ownerId: string,
    status: StrictQueueMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
    this.updatedAt = updatedAt;
    this.durationMinutes = durationMinutes;
    this.cohort = cohort;
    this.channel = channel;
    this.ownerId = ownerId;
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

  canMoveTo(next: StrictQueueMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictQueueMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict queue metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.frequencyCap * this.updatedAt * 100) / 100;
  }

  copy(): StrictQueueMetric {
    return new StrictQueueMetric(
      this.code,
      this.label,
      this.sequence,
      this.frequencyCap,
      this.updatedAt,
      this.durationMinutes,
      this.cohort,
      this.channel,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict queue metric in status requested. */
export function newStrictQueueMetric(code: string, label: string): StrictQueueMetric {
  return new StrictQueueMetric(code, label, 0, 0, 0, 0, "", "", "", "requested");
}
