import * as text from "../../../../kit/text.js";

/** Where a manual tier manifest is in its life cycle. */
export type ManualTierManifestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual tier manifest and its current status. */
export class ManualTierManifest {
  code: string;
  label: string;
  bid: number;
  budget: number;
  cost: number;
  active: boolean;
  batchSize: number;
  status: ManualTierManifestStatus;

  constructor(
    code: string,
    label: string,
    bid: number,
    budget: number,
    cost: number,
    active: boolean,
    batchSize: number,
    status: ManualTierManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.bid = bid;
    this.budget = budget;
    this.cost = cost;
    this.active = active;
    this.batchSize = batchSize;
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

  canMoveTo(next: ManualTierManifestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ManualTierManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.cost + this.batchSize) * 100) / 100;
  }

  copy(): ManualTierManifest {
    return new ManualTierManifest(
      this.code,
      this.label,
      this.bid,
      this.budget,
      this.cost,
      this.active,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual tier manifest in status requested. */
export function newManualTierManifest(code: string, label: string): ManualTierManifest {
  return new ManualTierManifest(code, label, 0, 0, 0, false, 0, "requested");
}
