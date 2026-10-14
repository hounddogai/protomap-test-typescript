/**
 * The scheduled csat batch records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled csat batch is in its life cycle. */
export type ScheduledCsatBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled csat batch. Its code is unique within a tenant. */
export class ScheduledCsatBatch {
  code: string;
  title: string;
  variant: string;
  approved: boolean;
  threshold: number;
  durationMinutes: number;
  locale: string;
  openRate: number;
  status: ScheduledCsatBatchStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    approved: boolean,
    threshold: number,
    durationMinutes: number,
    locale: string,
    openRate: number,
    status: ScheduledCsatBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.approved = approved;
    this.threshold = threshold;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.openRate = openRate;
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

  canMoveTo(next: ScheduledCsatBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledCsatBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled csat batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.threshold + this.durationMinutes) * 100) / 100;
  }

  copy(): ScheduledCsatBatch {
    return new ScheduledCsatBatch(
      this.code,
      this.title,
      this.variant,
      this.approved,
      this.threshold,
      this.durationMinutes,
      this.locale,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled csat batch in status idle. */
export function newScheduledCsatBatch(code: string, title: string): ScheduledCsatBatch {
  return new ScheduledCsatBatch(code, title, "", false, 0, 0, "", 0, "idle");
}
