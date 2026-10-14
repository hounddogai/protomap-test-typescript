/**
 * The invite record records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite record is in its life cycle. */
export type InviteRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One invite record, with what the planners need to act on it. */
export class InviteRecord {
  code: string;
  title: string;
  maximum: number;
  summary: string;
  unit: string;
  impressions: number;
  weight: number;
  batchSize: number;
  journeyId: string;
  active: boolean;
  expiresAt: number;
  status: InviteRecordStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    summary: string,
    unit: string,
    impressions: number,
    weight: number,
    batchSize: number,
    journeyId: string,
    active: boolean,
    expiresAt: number,
    status: InviteRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.summary = summary;
    this.unit = unit;
    this.impressions = impressions;
    this.weight = weight;
    this.batchSize = batchSize;
    this.journeyId = journeyId;
    this.active = active;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: InviteRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: InviteRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"invite record"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.weight - this.impressions) * 100) / 100;
  }

  copy(): InviteRecord {
    return new InviteRecord(
      this.code,
      this.title,
      this.maximum,
      this.summary,
      this.unit,
      this.impressions,
      this.weight,
      this.batchSize,
      this.journeyId,
      this.active,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a invite record in status requested. */
export function newInviteRecord(code: string, title: string): InviteRecord {
  return new InviteRecord(code, title, 0, "", "", 0, 0, 0, "", false, 0, "requested");
}
