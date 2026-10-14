import * as text from "../../../../kit/text.js";

/** Where a global reward target is in its life cycle. */
export type GlobalRewardTargetStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a global reward target and its current status. */
export class GlobalRewardTarget {
  code: string;
  name: string;
  impressions: number;
  campaignRef: string;
  createdAt: number;
  status: GlobalRewardTargetStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    campaignRef: string,
    createdAt: number,
    status: GlobalRewardTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.createdAt = createdAt;
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

  canMoveTo(next: GlobalRewardTargetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalRewardTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global reward target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.createdAt - this.impressions) * 100) / 100;
  }

  copy(): GlobalRewardTarget {
    return new GlobalRewardTarget(
      this.code,
      this.name,
      this.impressions,
      this.campaignRef,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global reward target in status requested. */
export function newGlobalRewardTarget(code: string, name: string): GlobalRewardTarget {
  return new GlobalRewardTarget(code, name, 0, "", 0, "requested");
}
