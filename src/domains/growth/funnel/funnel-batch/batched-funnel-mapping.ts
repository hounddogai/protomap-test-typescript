import * as text from "../../../../kit/text.js";

/** Where a batched funnel mapping is in its life cycle. */
export type BatchedFunnelMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A batched funnel mapping. Its code is unique within a tenant. */
export class BatchedFunnelMapping {
  code: string;
  title: string;
  unit: string;
  durationMinutes: number;
  maximum: number;
  bid: number;
  startsAt: number;
  ratio: number;
  country: string;
  sequence: number;
  status: BatchedFunnelMappingStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    durationMinutes: number,
    maximum: number,
    bid: number,
    startsAt: number,
    ratio: number,
    country: string,
    sequence: number,
    status: BatchedFunnelMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.durationMinutes = durationMinutes;
    this.maximum = maximum;
    this.bid = bid;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.country = country;
    this.sequence = sequence;
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

  canMoveTo(next: BatchedFunnelMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedFunnelMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.bid - this.startsAt) * 100) / 100;
  }

  copy(): BatchedFunnelMapping {
    return new BatchedFunnelMapping(
      this.code,
      this.title,
      this.unit,
      this.durationMinutes,
      this.maximum,
      this.bid,
      this.startsAt,
      this.ratio,
      this.country,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched funnel mapping in status idle. */
export function newBatchedFunnelMapping(code: string, title: string): BatchedFunnelMapping {
  return new BatchedFunnelMapping(code, title, "", 0, 0, 0, 0, 0, "", 0, "idle");
}
