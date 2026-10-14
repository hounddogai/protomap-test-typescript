import * as text from "../../../../kit/text.js";

/** Where a global flight claim is in its life cycle. */
export type GlobalFlightClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global flight claim, with what the planners need to act on it. */
export class GlobalFlightClaim {
  code: string;
  name: string;
  windowDays: number;
  contactEmail: string;
  score: number;
  priority: number;
  discount: number;
  version: number;
  sequence: number;
  status: GlobalFlightClaimStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    contactEmail: string,
    score: number,
    priority: number,
    discount: number,
    version: number,
    sequence: number,
    status: GlobalFlightClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.score = score;
    this.priority = priority;
    this.discount = discount;
    this.version = version;
    this.sequence = sequence;
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

  canMoveTo(next: GlobalFlightClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: GlobalFlightClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global flight claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedLoad(): number {
    return Math.round((this.sequence + this.windowDays) * 100) / 100;
  }

  copy(): GlobalFlightClaim {
    return new GlobalFlightClaim(
      this.code,
      this.name,
      this.windowDays,
      this.contactEmail,
      this.score,
      this.priority,
      this.discount,
      this.version,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global flight claim in status idle. */
export function newGlobalFlightClaim(code: string, name: string): GlobalFlightClaim {
  return new GlobalFlightClaim(code, name, 0, "", 0, 0, 0, 0, 0, "idle");
}
