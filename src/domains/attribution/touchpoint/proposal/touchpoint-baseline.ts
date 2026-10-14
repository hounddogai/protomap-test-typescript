import * as text from "../../../../kit/text.js";

/** Where a touchpoint baseline is in its life cycle. */
export type TouchpointBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A touchpoint baseline as the touchpoint team keeps it. */
export class TouchpointBaseline {
  code: string;
  name: string;
  openRate: number;
  unit: string;
  updatedAt: number;
  cohort: string;
  endsAt: number;
  bid: number;
  status: TouchpointBaselineStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    unit: string,
    updatedAt: number,
    cohort: string,
    endsAt: number,
    bid: number,
    status: TouchpointBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.unit = unit;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.endsAt = endsAt;
    this.bid = bid;
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

  canMoveTo(next: TouchpointBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
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

  moveTo(next: TouchpointBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedVolume(): number {
    return Math.round(this.updatedAt * this.bid * 100) / 100;
  }

  copy(): TouchpointBaseline {
    return new TouchpointBaseline(
      this.code,
      this.name,
      this.openRate,
      this.unit,
      this.updatedAt,
      this.cohort,
      this.endsAt,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a touchpoint baseline in status idle. */
export function newTouchpointBaseline(code: string, name: string): TouchpointBaseline {
  return new TouchpointBaseline(code, name, 0, "", 0, "", 0, 0, "idle");
}
