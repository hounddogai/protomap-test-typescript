import * as text from "../../../../kit/text.js";

/** Where a regional placement profile is in its life cycle. */
export type RegionalPlacementProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A regional placement profile as the placement team keeps it. */
export class RegionalPlacementProfile {
  code: string;
  title: string;
  startsAt: number;
  discount: number;
  active: boolean;
  audienceId: string;
  status: RegionalPlacementProfileStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    discount: number,
    active: boolean,
    audienceId: string,
    status: RegionalPlacementProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.discount = discount;
    this.active = active;
    this.audienceId = audienceId;
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

  canMoveTo(next: RegionalPlacementProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalPlacementProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt - this.discount) * 100) / 100;
  }

  copy(): RegionalPlacementProfile {
    return new RegionalPlacementProfile(
      this.code,
      this.title,
      this.startsAt,
      this.discount,
      this.active,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional placement profile in status idle. */
export function newRegionalPlacementProfile(code: string, title: string): RegionalPlacementProfile {
  return new RegionalPlacementProfile(code, title, 0, 0, false, "", "idle");
}
