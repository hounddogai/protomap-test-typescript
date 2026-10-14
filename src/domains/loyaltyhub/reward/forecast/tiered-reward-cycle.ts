import * as text from "../../../../kit/text.js";

/** Where a tiered reward cycle is in its life cycle. */
export type TieredRewardCycleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered reward cycle. Its code is unique within a tenant. */
export class TieredRewardCycle {
  code: string;
  label: string;
  expiresAt: number;
  cost: number;
  source: string;
  checksum: string;
  frequencyCap: number;
  notes: string;
  audienceId: string;
  title: string;
  status: TieredRewardCycleStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    cost: number,
    source: string,
    checksum: string,
    frequencyCap: number,
    notes: string,
    audienceId: string,
    title: string,
    status: TieredRewardCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.cost = cost;
    this.source = source;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.audienceId = audienceId;
    this.title = title;
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

  canMoveTo(next: TieredRewardCycleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredRewardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reward cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round((this.cost - this.expiresAt) * 100) / 100;
  }

  copy(): TieredRewardCycle {
    return new TieredRewardCycle(
      this.code,
      this.label,
      this.expiresAt,
      this.cost,
      this.source,
      this.checksum,
      this.frequencyCap,
      this.notes,
      this.audienceId,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered reward cycle in status proposed. */
export function newTieredRewardCycle(code: string, label: string): TieredRewardCycle {
  return new TieredRewardCycle(code, label, 0, 0, "", "", 0, "", "", "", "proposed");
}
