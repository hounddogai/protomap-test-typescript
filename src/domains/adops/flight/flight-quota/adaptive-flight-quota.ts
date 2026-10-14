/**
 * The adaptive flight quota records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive flight quota is in its life cycle. */
export type AdaptiveFlightQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive flight quota and its current status. */
export class AdaptiveFlightQuota {
  code: string;
  label: string;
  impressions: number;
  title: string;
  ratio: number;
  journeyId: string;
  threshold: number;
  maximum: number;
  status: AdaptiveFlightQuotaStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    title: string,
    ratio: number,
    journeyId: string,
    threshold: number,
    maximum: number,
    status: AdaptiveFlightQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.title = title;
    this.ratio = ratio;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.maximum = maximum;
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

  canMoveTo(next: AdaptiveFlightQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveFlightQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive flight quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round(this.ratio * this.impressions * 100) / 100;
  }

  copy(): AdaptiveFlightQuota {
    return new AdaptiveFlightQuota(
      this.code,
      this.label,
      this.impressions,
      this.title,
      this.ratio,
      this.journeyId,
      this.threshold,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive flight quota in status idle. */
export function newAdaptiveFlightQuota(code: string, label: string): AdaptiveFlightQuota {
  return new AdaptiveFlightQuota(code, label, 0, "", 0, "", 0, 0, "idle");
}
