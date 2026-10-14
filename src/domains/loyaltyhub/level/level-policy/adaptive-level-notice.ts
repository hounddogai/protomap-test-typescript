import * as text from "../../../../kit/text.js";

/** Where a adaptive level notice is in its life cycle. */
export type AdaptiveLevelNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a adaptive level notice and its current status. */
export class AdaptiveLevelNotice {
  code: string;
  label: string;
  source: string;
  journeyId: string;
  rate: number;
  approved: boolean;
  reviewer: string;
  floorValue: number;
  sequence: number;
  cost: number;
  status: AdaptiveLevelNoticeStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    journeyId: string,
    rate: number,
    approved: boolean,
    reviewer: string,
    floorValue: number,
    sequence: number,
    cost: number,
    status: AdaptiveLevelNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.journeyId = journeyId;
    this.rate = rate;
    this.approved = approved;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.sequence = sequence;
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

  canMoveTo(next: AdaptiveLevelNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: AdaptiveLevelNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive level notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.cost + this.rate) * 100) / 100;
  }

  copy(): AdaptiveLevelNotice {
    return new AdaptiveLevelNotice(
      this.code,
      this.label,
      this.source,
      this.journeyId,
      this.rate,
      this.approved,
      this.reviewer,
      this.floorValue,
      this.sequence,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive level notice in status idle. */
export function newAdaptiveLevelNotice(code: string, label: string): AdaptiveLevelNotice {
  return new AdaptiveLevelNotice(code, label, "", "", 0, false, "", 0, 0, 0, "idle");
}
