/**
 * The placement profile records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement profile is in its life cycle. */
export type PlacementProfileStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A placement profile. Its code is unique within a tenant. */
export class PlacementProfile {
  code: string;
  title: string;
  externalRef: string;
  journeyId: string;
  approved: boolean;
  durationMinutes: number;
  status: PlacementProfileStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    journeyId: string,
    approved: boolean,
    durationMinutes: number,
    status: PlacementProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.approved = approved;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: PlacementProfileStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PlacementProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): PlacementProfile {
    return new PlacementProfile(
      this.code,
      this.title,
      this.externalRef,
      this.journeyId,
      this.approved,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement profile in status idle. */
export function newPlacementProfile(code: string, title: string): PlacementProfile {
  return new PlacementProfile(code, title, "", "", false, 0, "idle");
}
