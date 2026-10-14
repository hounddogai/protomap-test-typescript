/**
 * The tiered conversion threshold records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered conversion threshold is in its life cycle. */
export type TieredConversionThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered conversion threshold as the conversion team keeps it. */
export class TieredConversionThreshold {
  code: string;
  label: string;
  timezone: string;
  openRate: number;
  channel: string;
  updatedAt: number;
  priority: number;
  sendAt: number;
  clicks: number;
  notes: string;
  revision: number;
  status: TieredConversionThresholdStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    openRate: number,
    channel: string,
    updatedAt: number,
    priority: number,
    sendAt: number,
    clicks: number,
    notes: string,
    revision: number,
    status: TieredConversionThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.openRate = openRate;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.notes = notes;
    this.revision = revision;
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

  canMoveTo(next: TieredConversionThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
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

  moveTo(next: TieredConversionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered conversion threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt - this.revision) * 100) / 100;
  }

  copy(): TieredConversionThreshold {
    return new TieredConversionThreshold(
      this.code,
      this.label,
      this.timezone,
      this.openRate,
      this.channel,
      this.updatedAt,
      this.priority,
      this.sendAt,
      this.clicks,
      this.notes,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered conversion threshold in status proposed. */
export function newTieredConversionThreshold(code: string, label: string): TieredConversionThreshold {
  return new TieredConversionThreshold(code, label, "", 0, "", 0, 0, 0, 0, "", 0, "proposed");
}
