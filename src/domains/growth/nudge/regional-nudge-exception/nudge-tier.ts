import * as text from "../../../../kit/text.js";

/** Where a nudge tier is in its life cycle. */
export type NudgeTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a nudge tier and its current status. */
export class NudgeTier {
  code: string;
  name: string;
  source: string;
  quantity: number;
  reviewer: string;
  floorValue: number;
  pinned: boolean;
  notes: string;
  locale: string;
  status: NudgeTierStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    quantity: number,
    reviewer: string,
    floorValue: number,
    pinned: boolean,
    notes: string,
    locale: string,
    status: NudgeTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.notes = notes;
    this.locale = locale;
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

  canMoveTo(next: NudgeTierStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "stopped";
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

  moveTo(next: NudgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"nudge tier"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.quantity * this.floorValue * 100) / 100;
  }

  copy(): NudgeTier {
    return new NudgeTier(
      this.code,
      this.name,
      this.source,
      this.quantity,
      this.reviewer,
      this.floorValue,
      this.pinned,
      this.notes,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a nudge tier in status idle. */
export function newNudgeTier(code: string, name: string): NudgeTier {
  return new NudgeTier(code, name, "", 0, "", 0, false, "", "", "idle");
}
