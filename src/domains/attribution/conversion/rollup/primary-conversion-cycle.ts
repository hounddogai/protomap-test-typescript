import * as text from "../../../../kit/text.js";

/** Where a primary conversion cycle is in its life cycle. */
export type PrimaryConversionCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a primary conversion cycle and its current status. */
export class PrimaryConversionCycle {
  code: string;
  label: string;
  windowDays: number;
  pinned: boolean;
  threshold: number;
  capacity: number;
  channel: string;
  visible: boolean;
  startsAt: number;
  priority: number;
  campaignRef: string;
  status: PrimaryConversionCycleStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    pinned: boolean,
    threshold: number,
    capacity: number,
    channel: string,
    visible: boolean,
    startsAt: number,
    priority: number,
    campaignRef: string,
    status: PrimaryConversionCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.pinned = pinned;
    this.threshold = threshold;
    this.capacity = capacity;
    this.channel = channel;
    this.visible = visible;
    this.startsAt = startsAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryConversionCycleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimaryConversionCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.windowDays - this.capacity) * 100) / 100;
  }

  copy(): PrimaryConversionCycle {
    return new PrimaryConversionCycle(
      this.code,
      this.label,
      this.windowDays,
      this.pinned,
      this.threshold,
      this.capacity,
      this.channel,
      this.visible,
      this.startsAt,
      this.priority,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary conversion cycle in status open. */
export function newPrimaryConversionCycle(code: string, label: string): PrimaryConversionCycle {
  return new PrimaryConversionCycle(code, label, 0, false, 0, 0, "", false, 0, 0, "", "open");
}
