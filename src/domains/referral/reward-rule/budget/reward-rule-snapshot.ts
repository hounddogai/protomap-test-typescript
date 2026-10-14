import * as text from "../../../../kit/text.js";

/** Where a reward rule snapshot is in its life cycle. */
export type RewardRuleSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** A reward rule snapshot. Its code is unique within a tenant. */
export class RewardRuleSnapshot {
  code: string;
  label: string;
  limit: number;
  threshold: number;
  sendAt: number;
  reviewer: string;
  createdAt: number;
  capacity: number;
  status: RewardRuleSnapshotStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    threshold: number,
    sendAt: number,
    reviewer: string,
    createdAt: number,
    capacity: number,
    status: RewardRuleSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.threshold = threshold;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.createdAt = createdAt;
    this.capacity = capacity;
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

  canMoveTo(next: RewardRuleSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RewardRuleSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward rule snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.capacity * this.createdAt * 100) / 100;
  }

  copy(): RewardRuleSnapshot {
    return new RewardRuleSnapshot(
      this.code,
      this.label,
      this.limit,
      this.threshold,
      this.sendAt,
      this.reviewer,
      this.createdAt,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reward rule snapshot in status requested. */
export function newRewardRuleSnapshot(code: string, label: string): RewardRuleSnapshot {
  return new RewardRuleSnapshot(code, label, 0, 0, 0, "", 0, 0, "requested");
}
