/**
 * The primary enrollment digest records of journeys's enrollment work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary enrollment digest is in its life cycle. */
export type PrimaryEnrollmentDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary enrollment digest. Its code is unique within a tenant. */
export class PrimaryEnrollmentDigest {
  code: string;
  label: string;
  quantity: number;
  minimum: number;
  budget: number;
  checksum: string;
  channel: string;
  status: PrimaryEnrollmentDigestStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    minimum: number,
    budget: number,
    checksum: string,
    channel: string,
    status: PrimaryEnrollmentDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.minimum = minimum;
    this.budget = budget;
    this.checksum = checksum;
    this.channel = channel;
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

  canMoveTo(next: PrimaryEnrollmentDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
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
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryEnrollmentDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary enrollment digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.minimum * this.quantity * 100) / 100;
  }

  copy(): PrimaryEnrollmentDigest {
    return new PrimaryEnrollmentDigest(
      this.code,
      this.label,
      this.quantity,
      this.minimum,
      this.budget,
      this.checksum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary enrollment digest in status idle. */
export function newPrimaryEnrollmentDigest(code: string, label: string): PrimaryEnrollmentDigest {
  return new PrimaryEnrollmentDigest(code, label, 0, 0, 0, "", "", "idle");
}
