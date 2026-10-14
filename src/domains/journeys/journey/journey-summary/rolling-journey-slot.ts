import * as text from "../../../../kit/text.js";

/** Where a rolling journey slot is in its life cycle. */
export type RollingJourneySlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling journey slot and its current status. */
export class RollingJourneySlot {
  code: string;
  label: string;
  campaignRef: string;
  visible: boolean;
  clicks: number;
  expiresAt: number;
  journeyId: string;
  cost: number;
  status: RollingJourneySlotStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    visible: boolean,
    clicks: number,
    expiresAt: number,
    journeyId: string,
    cost: number,
    status: RollingJourneySlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.journeyId = journeyId;
    this.cost = cost;
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

  canMoveTo(next: RollingJourneySlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingJourneySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.expiresAt + this.clicks) * 100) / 100;
  }

  copy(): RollingJourneySlot {
    return new RollingJourneySlot(
      this.code,
      this.label,
      this.campaignRef,
      this.visible,
      this.clicks,
      this.expiresAt,
      this.journeyId,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling journey slot in status idle. */
export function newRollingJourneySlot(code: string, label: string): RollingJourneySlot {
  return new RollingJourneySlot(code, label, "", false, 0, 0, "", 0, "idle");
}
