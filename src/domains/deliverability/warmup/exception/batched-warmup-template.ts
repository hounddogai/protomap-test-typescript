import * as text from "../../../../kit/text.js";

/** Where a batched warmup template is in its life cycle. */
export type BatchedWarmupTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched warmup template. Its code is unique within a tenant. */
export class BatchedWarmupTemplate {
  code: string;
  name: string;
  limit: number;
  cost: number;
  startsAt: number;
  openRate: number;
  segment: string;
  status: BatchedWarmupTemplateStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    cost: number,
    startsAt: number,
    openRate: number,
    segment: string,
    status: BatchedWarmupTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.cost = cost;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.segment = segment;
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

  canMoveTo(next: BatchedWarmupTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
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

  moveTo(next: BatchedWarmupTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"batched warmup template"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.limit - this.openRate) * 100) / 100;
  }

  copy(): BatchedWarmupTemplate {
    return new BatchedWarmupTemplate(
      this.code,
      this.name,
      this.limit,
      this.cost,
      this.startsAt,
      this.openRate,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched warmup template in status idle. */
export function newBatchedWarmupTemplate(code: string, name: string): BatchedWarmupTemplate {
  return new BatchedWarmupTemplate(code, name, 0, 0, 0, 0, "", "idle");
}
