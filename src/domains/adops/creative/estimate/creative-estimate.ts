/**
 * The creative estimate records of adops's creative work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative estimate is in its life cycle. */
export type CreativeEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A creative estimate. Its code is unique within a tenant. */
export class CreativeEstimate {
  code: string;
  label: string;
  retries: number;
  channel: string;
  openRate: number;
  status: CreativeEstimateStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    channel: string,
    openRate: number,
    status: CreativeEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.channel = channel;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.retries + this.openRate) * 100) / 100;
  }

  copy(): CreativeEstimate {
    return new CreativeEstimate(this.code, this.label, this.retries, this.channel, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a creative estimate in status draft. */
export function newCreativeEstimate(code: string, label: string): CreativeEstimate {
  return new CreativeEstimate(code, label, 0, "", 0, "draft");
}
