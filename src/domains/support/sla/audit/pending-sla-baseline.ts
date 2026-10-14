import * as text from "../../../../kit/text.js";

/** Where a pending sla baseline is in its life cycle. */
export type PendingSlaBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending sla baseline, with what the planners need to act on it. */
export class PendingSlaBaseline {
  code: string;
  name: string;
  rate: number;
  active: boolean;
  unit: string;
  minimum: number;
  region: string;
  status: PendingSlaBaselineStatus;

  constructor(
    code: string,
    name: string,
    rate: number,
    active: boolean,
    unit: string,
    minimum: number,
    region: string,
    status: PendingSlaBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.rate = rate;
    this.active = active;
    this.unit = unit;
    this.minimum = minimum;
    this.region = region;
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

  canMoveTo(next: PendingSlaBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
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

  moveTo(next: PendingSlaBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending sla baseline"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.rate - this.minimum) * 100) / 100;
  }

  copy(): PendingSlaBaseline {
    return new PendingSlaBaseline(
      this.code,
      this.name,
      this.rate,
      this.active,
      this.unit,
      this.minimum,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending sla baseline in status idle. */
export function newPendingSlaBaseline(code: string, name: string): PendingSlaBaseline {
  return new PendingSlaBaseline(code, name, 0, false, "", 0, "", "idle");
}
