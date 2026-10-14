/**
 * The approval manifest records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval manifest is in its life cycle. */
export type ApprovalManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A approval manifest as the approval team keeps it. */
export class ApprovalManifest {
  code: string;
  name: string;
  reviewer: string;
  limit: number;
  weight: number;
  visible: boolean;
  approved: boolean;
  durationMinutes: number;
  openRate: number;
  graceDays: number;
  status: ApprovalManifestStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    limit: number,
    weight: number,
    visible: boolean,
    approved: boolean,
    durationMinutes: number,
    openRate: number,
    graceDays: number,
    status: ApprovalManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.limit = limit;
    this.weight = weight;
    this.visible = visible;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
    this.openRate = openRate;
    this.graceDays = graceDays;
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

  canMoveTo(next: ApprovalManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ApprovalManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.weight - this.durationMinutes) * 100) / 100;
  }

  copy(): ApprovalManifest {
    return new ApprovalManifest(
      this.code,
      this.name,
      this.reviewer,
      this.limit,
      this.weight,
      this.visible,
      this.approved,
      this.durationMinutes,
      this.openRate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval manifest in status new. */
export function newApprovalManifest(code: string, name: string): ApprovalManifest {
  return new ApprovalManifest(code, name, "", 0, 0, false, false, 0, 0, 0, "new");
}
