import * as text from "../../../../kit/text.js";

/** Where a primary tier estimate is in its life cycle. */
export type PrimaryTierEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary tier estimate and its current status. */
export class PrimaryTierEstimate {
  code: string;
  label: string;
  active: boolean;
  channel: string;
  limit: number;
  notes: string;
  quantity: number;
  weight: number;
  discount: number;
  updatedAt: number;
  archived: boolean;
  status: PrimaryTierEstimateStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    channel: string,
    limit: number,
    notes: string,
    quantity: number,
    weight: number,
    discount: number,
    updatedAt: number,
    archived: boolean,
    status: PrimaryTierEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.channel = channel;
    this.limit = limit;
    this.notes = notes;
    this.quantity = quantity;
    this.weight = weight;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.archived = archived;
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

  canMoveTo(next: PrimaryTierEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryTierEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary tier estimate"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.limit - this.quantity) * 100) / 100;
  }

  copy(): PrimaryTierEstimate {
    return new PrimaryTierEstimate(
      this.code,
      this.label,
      this.active,
      this.channel,
      this.limit,
      this.notes,
      this.quantity,
      this.weight,
      this.discount,
      this.updatedAt,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary tier estimate in status requested. */
export function newPrimaryTierEstimate(code: string, label: string): PrimaryTierEstimate {
  return new PrimaryTierEstimate(code, label, false, "", 0, "", 0, 0, 0, 0, false, "requested");
}
