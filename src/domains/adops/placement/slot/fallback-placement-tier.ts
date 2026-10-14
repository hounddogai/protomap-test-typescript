import * as text from "../../../../kit/text.js";

/** Where a fallback placement tier is in its life cycle. */
export type FallbackPlacementTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback placement tier, with what the planners need to act on it. */
export class FallbackPlacementTier {
  code: string;
  name: string;
  maximum: number;
  sequence: number;
  pinned: boolean;
  startsAt: number;
  visible: boolean;
  cost: number;
  utmSource: string;
  journeyId: string;
  status: FallbackPlacementTierStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    sequence: number,
    pinned: boolean,
    startsAt: number,
    visible: boolean,
    cost: number,
    utmSource: string,
    journeyId: string,
    status: FallbackPlacementTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.sequence = sequence;
    this.pinned = pinned;
    this.startsAt = startsAt;
    this.visible = visible;
    this.cost = cost;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
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

  canMoveTo(next: FallbackPlacementTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: FallbackPlacementTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback placement tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence - this.startsAt) * 100) / 100;
  }

  copy(): FallbackPlacementTier {
    return new FallbackPlacementTier(
      this.code,
      this.name,
      this.maximum,
      this.sequence,
      this.pinned,
      this.startsAt,
      this.visible,
      this.cost,
      this.utmSource,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback placement tier in status idle. */
export function newFallbackPlacementTier(code: string, name: string): FallbackPlacementTier {
  return new FallbackPlacementTier(code, name, 0, 0, false, 0, false, 0, "", "", "idle");
}
