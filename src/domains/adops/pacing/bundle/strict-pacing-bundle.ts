/**
 * The strict pacing bundle records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict pacing bundle is in its life cycle. */
export type StrictPacingBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A strict pacing bundle as the pacing team keeps it. */
export class StrictPacingBundle {
  code: string;
  name: string;
  updatedAt: number;
  sendAt: number;
  region: string;
  segment: string;
  minimum: number;
  floorValue: number;
  status: StrictPacingBundleStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    sendAt: number,
    region: string,
    segment: string,
    minimum: number,
    floorValue: number,
    status: StrictPacingBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.sendAt = sendAt;
    this.region = region;
    this.segment = segment;
    this.minimum = minimum;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPacingBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictPacingBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict pacing bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.minimum - this.floorValue) * 100) / 100;
  }

  copy(): StrictPacingBundle {
    return new StrictPacingBundle(
      this.code,
      this.name,
      this.updatedAt,
      this.sendAt,
      this.region,
      this.segment,
      this.minimum,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict pacing bundle in status proposed. */
export function newStrictPacingBundle(code: string, name: string): StrictPacingBundle {
  return new StrictPacingBundle(code, name, 0, 0, "", "", 0, 0, "proposed");
}
