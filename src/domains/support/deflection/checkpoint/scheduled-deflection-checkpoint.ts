/**
 * The scheduled deflection checkpoint records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled deflection checkpoint is in its life cycle. */
export type ScheduledDeflectionCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled deflection checkpoint, with what the planners need to act on it. */
export class ScheduledDeflectionCheckpoint {
  code: string;
  title: string;
  audienceId: string;
  impressions: number;
  unit: string;
  conversionRate: number;
  sendAt: number;
  rate: number;
  journeyId: string;
  phone: string;
  cost: number;
  status: ScheduledDeflectionCheckpointStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    impressions: number,
    unit: string,
    conversionRate: number,
    sendAt: number,
    rate: number,
    journeyId: string,
    phone: string,
    cost: number,
    status: ScheduledDeflectionCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.unit = unit;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.rate = rate;
    this.journeyId = journeyId;
    this.phone = phone;
    this.cost = cost;
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

  canMoveTo(next: ScheduledDeflectionCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDeflectionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled deflection checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled deflection checkpoint"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.conversionRate - this.cost) * 100) / 100;
  }

  copy(): ScheduledDeflectionCheckpoint {
    return new ScheduledDeflectionCheckpoint(
      this.code,
      this.title,
      this.audienceId,
      this.impressions,
      this.unit,
      this.conversionRate,
      this.sendAt,
      this.rate,
      this.journeyId,
      this.phone,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a scheduled deflection checkpoint in status requested. */
export function newScheduledDeflectionCheckpoint(code: string, title: string): ScheduledDeflectionCheckpoint {
  return new ScheduledDeflectionCheckpoint(code, title, "", 0, "", 0, 0, 0, "", "", 0, "requested");
}
