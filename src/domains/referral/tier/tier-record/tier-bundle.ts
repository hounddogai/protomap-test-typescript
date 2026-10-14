import * as text from "../../../../kit/text.js";

/** Where a tier bundle is in its life cycle. */
export type TierBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tier bundle, with what the planners need to act on it. */
export class TierBundle {
  code: string;
  name: string;
  approved: boolean;
  description: string;
  startsAt: number;
  utmSource: string;
  region: string;
  status: TierBundleStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    description: string,
    startsAt: number,
    utmSource: string,
    region: string,
    status: TierBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.description = description;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
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

  canMoveTo(next: TierBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: TierBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tier bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): TierBundle {
    return new TierBundle(
      this.code,
      this.name,
      this.approved,
      this.description,
      this.startsAt,
      this.utmSource,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tier bundle in status idle. */
export function newTierBundle(code: string, name: string): TierBundle {
  return new TierBundle(code, name, false, "", 0, "", "", "idle");
}
