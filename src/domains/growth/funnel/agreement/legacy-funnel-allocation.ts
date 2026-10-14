import * as text from "../../../../kit/text.js";

/** Where a legacy funnel allocation is in its life cycle. */
export type LegacyFunnelAllocationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a legacy funnel allocation and its current status. */
export class LegacyFunnelAllocation {
  code: string;
  title: string;
  batchSize: number;
  capacity: number;
  attributes: Map<string, string>;
  bid: number;
  externalRef: string;
  status: LegacyFunnelAllocationStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    capacity: number,
    attributes: Map<string, string>,
    bid: number,
    externalRef: string,
    status: LegacyFunnelAllocationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.capacity = capacity;
    this.attributes = attributes;
    this.bid = bid;
    this.externalRef = externalRef;
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

  canMoveTo(next: LegacyFunnelAllocationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
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

  moveTo(next: LegacyFunnelAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy funnel allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.bid + this.batchSize) * 100) / 100;
  }

  copy(): LegacyFunnelAllocation {
    return new LegacyFunnelAllocation(
      this.code,
      this.title,
      this.batchSize,
      this.capacity,
      this.attributes,
      this.bid,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy funnel allocation in status idle. */
export function newLegacyFunnelAllocation(code: string, title: string): LegacyFunnelAllocation {
  return new LegacyFunnelAllocation(code, title, 0, 0, new Map<string, string>(), 0, "", "idle");
}
