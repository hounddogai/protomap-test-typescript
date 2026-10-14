import * as text from "../../../../kit/text.js";

/** Where a pending reputation profile is in its life cycle. */
export type PendingReputationProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending reputation profile as the reputation team keeps it. */
export class PendingReputationProfile {
  code: string;
  title: string;
  sequence: number;
  updatedAt: number;
  batchSize: number;
  status: PendingReputationProfileStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    updatedAt: number,
    batchSize: number,
    status: PendingReputationProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingReputationProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingReputationProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.sequence + this.batchSize) * 100) / 100;
  }

  copy(): PendingReputationProfile {
    return new PendingReputationProfile(
      this.code,
      this.title,
      this.sequence,
      this.updatedAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending reputation profile in status planned. */
export function newPendingReputationProfile(code: string, title: string): PendingReputationProfile {
  return new PendingReputationProfile(code, title, 0, 0, 0, "planned");
}
