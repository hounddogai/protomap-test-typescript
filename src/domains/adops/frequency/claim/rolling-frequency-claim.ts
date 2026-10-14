/**
 * The rolling frequency claim records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling frequency claim is in its life cycle. */
export type RollingFrequencyClaimStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling frequency claim and its current status. */
export class RollingFrequencyClaim {
  code: string;
  name: string;
  description: string;
  externalRef: string;
  version: number;
  limit: number;
  phone: string;
  revision: number;
  status: RollingFrequencyClaimStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    externalRef: string,
    version: number,
    limit: number,
    phone: string,
    revision: number,
    status: RollingFrequencyClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.externalRef = externalRef;
    this.version = version;
    this.limit = limit;
    this.phone = phone;
    this.revision = revision;
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

  canMoveTo(next: RollingFrequencyClaimStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
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

  moveTo(next: RollingFrequencyClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling frequency claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"rolling frequency claim"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.revision + this.limit) * 100) / 100;
  }

  copy(): RollingFrequencyClaim {
    return new RollingFrequencyClaim(
      this.code,
      this.name,
      this.description,
      this.externalRef,
      this.version,
      this.limit,
      this.phone,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling frequency claim in status idle. */
export function newRollingFrequencyClaim(code: string, name: string): RollingFrequencyClaim {
  return new RollingFrequencyClaim(code, name, "", "", 0, 0, "", 0, "idle");
}
