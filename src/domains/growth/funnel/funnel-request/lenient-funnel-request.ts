/**
 * The lenient funnel request records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient funnel request is in its life cycle. */
export type LenientFunnelRequestStatus = "created" | "validated" | "published" | "retired";

/** A lenient funnel request as the funnel team keeps it. */
export class LenientFunnelRequest {
  code: string;
  title: string;
  windowDays: number;
  retries: number;
  unit: string;
  minimum: number;
  updatedAt: number;
  sequence: number;
  status: LenientFunnelRequestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    retries: number,
    unit: string,
    minimum: number,
    updatedAt: number,
    sequence: number,
    status: LenientFunnelRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.retries = retries;
    this.unit = unit;
    this.minimum = minimum;
    this.updatedAt = updatedAt;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientFunnelRequestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientFunnelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient funnel request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round((this.retries - this.windowDays) * 100) / 100;
  }

  copy(): LenientFunnelRequest {
    return new LenientFunnelRequest(
      this.code,
      this.title,
      this.windowDays,
      this.retries,
      this.unit,
      this.minimum,
      this.updatedAt,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient funnel request in status created. */
export function newLenientFunnelRequest(code: string, title: string): LenientFunnelRequest {
  return new LenientFunnelRequest(code, title, 0, 0, "", 0, 0, 0, "created");
}
