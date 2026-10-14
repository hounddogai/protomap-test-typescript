import * as text from "../../../../kit/text.js";

/** Where a tiered wait manifest is in its life cycle. */
export type TieredWaitManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a tiered wait manifest and its current status. */
export class TieredWaitManifest {
  code: string;
  label: string;
  updatedAt: number;
  impressions: number;
  reviewer: string;
  status: TieredWaitManifestStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    impressions: number,
    reviewer: string,
    status: TieredWaitManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.reviewer = reviewer;
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

  canMoveTo(next: TieredWaitManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: TieredWaitManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered wait manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.updatedAt + this.impressions) * 100) / 100;
  }

  copy(): TieredWaitManifest {
    return new TieredWaitManifest(this.code, this.label, this.updatedAt, this.impressions, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered wait manifest in status proposed. */
export function newTieredWaitManifest(code: string, label: string): TieredWaitManifest {
  return new TieredWaitManifest(code, label, 0, 0, "", "proposed");
}
