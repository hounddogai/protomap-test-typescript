/**
 * The primary placement checkpoint records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary placement checkpoint is in its life cycle. */
export type PrimaryPlacementCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary placement checkpoint and its current status. */
export class PrimaryPlacementCheckpoint {
  code: string;
  title: string;
  pinned: boolean;
  revision: number;
  floorValue: number;
  variant: string;
  attempts: number;
  clicks: number;
  currency: string;
  unit: string;
  status: PrimaryPlacementCheckpointStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    revision: number,
    floorValue: number,
    variant: string,
    attempts: number,
    clicks: number,
    currency: string,
    unit: string,
    status: PrimaryPlacementCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.revision = revision;
    this.floorValue = floorValue;
    this.variant = variant;
    this.attempts = attempts;
    this.clicks = clicks;
    this.currency = currency;
    this.unit = unit;
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

  canMoveTo(next: PrimaryPlacementCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPlacementCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary placement checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"primary placement checkpoint"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.clicks + this.revision) * 100) / 100;
  }

  copy(): PrimaryPlacementCheckpoint {
    return new PrimaryPlacementCheckpoint(
      this.code,
      this.title,
      this.pinned,
      this.revision,
      this.floorValue,
      this.variant,
      this.attempts,
      this.clicks,
      this.currency,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a primary placement checkpoint in status idle. */
export function newPrimaryPlacementCheckpoint(code: string, title: string): PrimaryPlacementCheckpoint {
  return new PrimaryPlacementCheckpoint(code, title, false, 0, 0, "", 0, 0, "", "", "idle");
}
