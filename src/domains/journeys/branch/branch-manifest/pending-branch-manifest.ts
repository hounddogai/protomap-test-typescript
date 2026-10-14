/**
 * The pending branch manifest records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending branch manifest is in its life cycle. */
export type PendingBranchManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending branch manifest, with what the planners need to act on it. */
export class PendingBranchManifest {
  code: string;
  label: string;
  country: string;
  cost: number;
  approved: boolean;
  discount: number;
  weight: number;
  segment: string;
  maximum: number;
  journeyId: string;
  status: PendingBranchManifestStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    cost: number,
    approved: boolean,
    discount: number,
    weight: number,
    segment: string,
    maximum: number,
    journeyId: string,
    status: PendingBranchManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.cost = cost;
    this.approved = approved;
    this.discount = discount;
    this.weight = weight;
    this.segment = segment;
    this.maximum = maximum;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingBranchManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingBranchManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending branch manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending branch manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.weight - this.maximum) * 100) / 100;
  }

  copy(): PendingBranchManifest {
    return new PendingBranchManifest(
      this.code,
      this.label,
      this.country,
      this.cost,
      this.approved,
      this.discount,
      this.weight,
      this.segment,
      this.maximum,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending branch manifest in status new. */
export function newPendingBranchManifest(code: string, label: string): PendingBranchManifest {
  return new PendingBranchManifest(code, label, "", 0, false, 0, 0, "", 0, "", "new");
}
