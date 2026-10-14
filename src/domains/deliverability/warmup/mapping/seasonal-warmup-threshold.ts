import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup threshold is in its life cycle. */
export type SeasonalWarmupThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One seasonal warmup threshold, with what the planners need to act on it. */
export class SeasonalWarmupThreshold {
  code: string;
  label: string;
  journeyId: string;
  sendAt: number;
  sequence: number;
  conversionRate: number;
  campaignRef: string;
  clicks: number;
  name: string;
  description: string;
  status: SeasonalWarmupThresholdStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    sendAt: number,
    sequence: number,
    conversionRate: number,
    campaignRef: string,
    clicks: number,
    name: string,
    description: string,
    status: SeasonalWarmupThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.clicks = clicks;
    this.name = name;
    this.description = description;
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

  canMoveTo(next: SeasonalWarmupThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: SeasonalWarmupThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal warmup threshold"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.conversionRate + this.clicks) * 100) / 100;
  }

  copy(): SeasonalWarmupThreshold {
    return new SeasonalWarmupThreshold(
      this.code,
      this.label,
      this.journeyId,
      this.sendAt,
      this.sequence,
      this.conversionRate,
      this.campaignRef,
      this.clicks,
      this.name,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal warmup threshold in status idle. */
export function newSeasonalWarmupThreshold(code: string, label: string): SeasonalWarmupThreshold {
  return new SeasonalWarmupThreshold(code, label, "", 0, 0, 0, "", 0, "", "", "idle");
}
