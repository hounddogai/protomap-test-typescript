import * as text from "../../../../kit/text.js";

/** Where a pending reputation allocation is in its life cycle. */
export type PendingReputationAllocationStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending reputation allocation and its current status. */
export class PendingReputationAllocation {
  code: string;
  name: string;
  journeyId: string;
  clicks: number;
  notes: string;
  revision: number;
  expiresAt: number;
  tags: string[];
  approved: boolean;
  status: PendingReputationAllocationStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    clicks: number,
    notes: string,
    revision: number,
    expiresAt: number,
    tags: string[],
    approved: boolean,
    status: PendingReputationAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.clicks = clicks;
    this.notes = notes;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.approved = approved;
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

  canMoveTo(next: PendingReputationAllocationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running";
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

  moveTo(next: PendingReputationAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt + this.revision) * 100) / 100;
  }

  copy(): PendingReputationAllocation {
    return new PendingReputationAllocation(
      this.code,
      this.name,
      this.journeyId,
      this.clicks,
      this.notes,
      this.revision,
      this.expiresAt,
      this.tags,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending reputation allocation in status new. */
export function newPendingReputationAllocation(code: string, name: string): PendingReputationAllocation {
  return new PendingReputationAllocation(code, name, "", 0, "", 0, 0, [], false, "new");
}
