import * as text from "../../../../kit/text.js";

/** Where a lenient flight draft is in its life cycle. */
export type LenientFlightDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient flight draft. Its code is unique within a tenant. */
export class LenientFlightDraft {
  code: string;
  name: string;
  bid: number;
  approved: boolean;
  pinned: boolean;
  channel: string;
  impressions: number;
  ceiling: number;
  attempts: number;
  status: LenientFlightDraftStatus;

  constructor(
    code: string,
    name: string,
    bid: number,
    approved: boolean,
    pinned: boolean,
    channel: string,
    impressions: number,
    ceiling: number,
    attempts: number,
    status: LenientFlightDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.approved = approved;
    this.pinned = pinned;
    this.channel = channel;
    this.impressions = impressions;
    this.ceiling = ceiling;
    this.attempts = attempts;
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

  canMoveTo(next: LenientFlightDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientFlightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient flight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"lenient flight draft"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.impressions * this.attempts * 100) / 100;
  }

  copy(): LenientFlightDraft {
    return new LenientFlightDraft(
      this.code,
      this.name,
      this.bid,
      this.approved,
      this.pinned,
      this.channel,
      this.impressions,
      this.ceiling,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient flight draft in status idle. */
export function newLenientFlightDraft(code: string, name: string): LenientFlightDraft {
  return new LenientFlightDraft(code, name, 0, false, false, "", 0, 0, 0, "idle");
}
