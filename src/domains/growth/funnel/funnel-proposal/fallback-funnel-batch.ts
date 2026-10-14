import * as text from "../../../../kit/text.js";

/** Where a fallback funnel batch is in its life cycle. */
export type FallbackFunnelBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback funnel batch and its current status. */
export class FallbackFunnelBatch {
  code: string;
  name: string;
  notes: string;
  updatedAt: number;
  bid: number;
  revision: number;
  country: string;
  timezone: string;
  cost: number;
  maximum: number;
  status: FallbackFunnelBatchStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    updatedAt: number,
    bid: number,
    revision: number,
    country: string,
    timezone: string,
    cost: number,
    maximum: number,
    status: FallbackFunnelBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.bid = bid;
    this.revision = revision;
    this.country = country;
    this.timezone = timezone;
    this.cost = cost;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackFunnelBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FallbackFunnelBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback funnel batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netExposure(): number {
    return Math.round((this.bid + this.updatedAt) * 100) / 100;
  }

  copy(): FallbackFunnelBatch {
    return new FallbackFunnelBatch(
      this.code,
      this.name,
      this.notes,
      this.updatedAt,
      this.bid,
      this.revision,
      this.country,
      this.timezone,
      this.cost,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback funnel batch in status proposed. */
export function newFallbackFunnelBatch(code: string, name: string): FallbackFunnelBatch {
  return new FallbackFunnelBatch(code, name, "", 0, 0, 0, "", "", 0, 0, "proposed");
}
