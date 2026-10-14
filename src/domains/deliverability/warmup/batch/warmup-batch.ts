/**
 * The warmup batch records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup batch is in its life cycle. */
export type WarmupBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A warmup batch as the warmup team keeps it. */
export class WarmupBatch {
  code: string;
  title: string;
  ownerId: string;
  windowDays: number;
  variant: string;
  rate: number;
  reviewer: string;
  budget: number;
  maximum: number;
  status: WarmupBatchStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    windowDays: number,
    variant: string,
    rate: number,
    reviewer: string,
    budget: number,
    maximum: number,
    status: WarmupBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.variant = variant;
    this.rate = rate;
    this.reviewer = reviewer;
    this.budget = budget;
    this.maximum = maximum;
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

  canMoveTo(next: WarmupBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WarmupBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.windowDays * 100) / 100;
  }

  copy(): WarmupBatch {
    return new WarmupBatch(
      this.code,
      this.title,
      this.ownerId,
      this.windowDays,
      this.variant,
      this.rate,
      this.reviewer,
      this.budget,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a warmup batch in status idle. */
export function newWarmupBatch(code: string, title: string): WarmupBatch {
  return new WarmupBatch(code, title, "", 0, "", 0, "", 0, 0, "idle");
}
