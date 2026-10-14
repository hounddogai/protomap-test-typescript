/**
 * The regional sla manifest records of support's sla work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional sla manifest is in its life cycle. */
export type RegionalSlaManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a regional sla manifest and its current status. */
export class RegionalSlaManifest {
  code: string;
  label: string;
  channel: string;
  maximum: number;
  attempts: number;
  reviewer: string;
  locale: string;
  conversionRate: number;
  updatedAt: number;
  ceiling: number;
  graceDays: number;
  status: RegionalSlaManifestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    maximum: number,
    attempts: number,
    reviewer: string,
    locale: string,
    conversionRate: number,
    updatedAt: number,
    ceiling: number,
    graceDays: number,
    status: RegionalSlaManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.maximum = maximum;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalSlaManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalSlaManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional sla manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.attempts - this.maximum) * 100) / 100;
  }

  copy(): RegionalSlaManifest {
    return new RegionalSlaManifest(
      this.code,
      this.label,
      this.channel,
      this.maximum,
      this.attempts,
      this.reviewer,
      this.locale,
      this.conversionRate,
      this.updatedAt,
      this.ceiling,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional sla manifest in status idle. */
export function newRegionalSlaManifest(code: string, label: string): RegionalSlaManifest {
  return new RegionalSlaManifest(code, label, "", 0, 0, "", "", 0, 0, 0, 0, "idle");
}
