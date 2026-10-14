/**
 * The activation estimate records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation estimate is in its life cycle. */
export type ActivationEstimateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a activation estimate and its current status. */
export class ActivationEstimate {
  code: string;
  name: string;
  endsAt: number;
  attempts: number;
  batchSize: number;
  expiresAt: number;
  archived: boolean;
  checksum: string;
  minimum: number;
  status: ActivationEstimateStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    attempts: number,
    batchSize: number,
    expiresAt: number,
    archived: boolean,
    checksum: string,
    minimum: number,
    status: ActivationEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.checksum = checksum;
    this.minimum = minimum;
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

  canMoveTo(next: ActivationEstimateStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ActivationEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.batchSize + this.minimum) * 100) / 100;
  }

  copy(): ActivationEstimate {
    return new ActivationEstimate(
      this.code,
      this.name,
      this.endsAt,
      this.attempts,
      this.batchSize,
      this.expiresAt,
      this.archived,
      this.checksum,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a activation estimate in status idle. */
export function newActivationEstimate(code: string, name: string): ActivationEstimate {
  return new ActivationEstimate(code, name, 0, 0, 0, 0, false, "", 0, "idle");
}
