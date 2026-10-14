import * as text from "../../../../kit/text.js";

/** Where a funnel override is in its life cycle. */
export type FunnelOverrideStatus = "created" | "validated" | "published" | "retired";

/** A funnel override as the funnel team keeps it. */
export class FunnelOverride {
  code: string;
  name: string;
  region: string;
  channel: string;
  externalRef: string;
  floorValue: number;
  openRate: number;
  batchSize: number;
  status: FunnelOverrideStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    channel: string,
    externalRef: string,
    floorValue: number,
    openRate: number,
    batchSize: number,
    status: FunnelOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.channel = channel;
    this.externalRef = externalRef;
    this.floorValue = floorValue;
    this.openRate = openRate;
    this.batchSize = batchSize;
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

  canMoveTo(next: FunnelOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.batchSize - this.floorValue) * 100) / 100;
  }

  copy(): FunnelOverride {
    return new FunnelOverride(
      this.code,
      this.name,
      this.region,
      this.channel,
      this.externalRef,
      this.floorValue,
      this.openRate,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a funnel override in status created. */
export function newFunnelOverride(code: string, name: string): FunnelOverride {
  return new FunnelOverride(code, name, "", "", "", 0, 0, 0, "created");
}
