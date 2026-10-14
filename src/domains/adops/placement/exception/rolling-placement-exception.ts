/**
 * The rolling placement exception records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling placement exception is in its life cycle. */
export type RollingPlacementExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling placement exception and its current status. */
export class RollingPlacementException {
  code: string;
  name: string;
  channel: string;
  batchSize: number;
  ownerId: string;
  utmSource: string;
  margin: number;
  conversionRate: number;
  retries: number;
  approved: boolean;
  status: RollingPlacementExceptionStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    batchSize: number,
    ownerId: string,
    utmSource: string,
    margin: number,
    conversionRate: number,
    retries: number,
    approved: boolean,
    status: RollingPlacementExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.batchSize = batchSize;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.approved = approved;
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

  canMoveTo(next: RollingPlacementExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingPlacementExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling placement exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.retries + this.margin) * 100) / 100;
  }

  copy(): RollingPlacementException {
    return new RollingPlacementException(
      this.code,
      this.name,
      this.channel,
      this.batchSize,
      this.ownerId,
      this.utmSource,
      this.margin,
      this.conversionRate,
      this.retries,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling placement exception in status idle. */
export function newRollingPlacementException(code: string, name: string): RollingPlacementException {
  return new RollingPlacementException(code, name, "", 0, "", "", 0, 0, 0, false, "idle");
}
