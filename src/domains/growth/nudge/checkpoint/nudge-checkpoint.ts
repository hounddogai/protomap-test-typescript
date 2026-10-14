/**
 * The nudge checkpoint records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge checkpoint is in its life cycle. */
export type NudgeCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** A nudge checkpoint. Its code is unique within a tenant. */
export class NudgeCheckpoint {
  code: string;
  name: string;
  visible: boolean;
  country: string;
  bid: number;
  revision: number;
  active: boolean;
  clicks: number;
  expiresAt: number;
  conversionRate: number;
  approved: boolean;
  status: NudgeCheckpointStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    country: string,
    bid: number,
    revision: number,
    active: boolean,
    clicks: number,
    expiresAt: number,
    conversionRate: number,
    approved: boolean,
    status: NudgeCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.country = country;
    this.bid = bid;
    this.revision = revision;
    this.active = active;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.approved = approved;
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

  canMoveTo(next: NudgeCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: NudgeCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.expiresAt - this.clicks) * 100) / 100;
  }

  copy(): NudgeCheckpoint {
    return new NudgeCheckpoint(
      this.code,
      this.name,
      this.visible,
      this.country,
      this.bid,
      this.revision,
      this.active,
      this.clicks,
      this.expiresAt,
      this.conversionRate,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a nudge checkpoint in status requested. */
export function newNudgeCheckpoint(code: string, name: string): NudgeCheckpoint {
  return new NudgeCheckpoint(code, name, false, "", 0, 0, false, 0, 0, 0, false, "requested");
}
