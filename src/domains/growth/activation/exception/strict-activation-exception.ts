/**
 * The strict activation exception records of growth's activation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict activation exception is in its life cycle. */
export type StrictActivationExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict activation exception. Its code is unique within a tenant. */
export class StrictActivationException {
  code: string;
  name: string;
  archived: boolean;
  active: boolean;
  timezone: string;
  maximum: number;
  startsAt: number;
  limit: number;
  clicks: number;
  country: string;
  status: StrictActivationExceptionStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    active: boolean,
    timezone: string,
    maximum: number,
    startsAt: number,
    limit: number,
    clicks: number,
    country: string,
    status: StrictActivationExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.active = active;
    this.timezone = timezone;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.limit = limit;
    this.clicks = clicks;
    this.country = country;
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

  canMoveTo(next: StrictActivationExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: StrictActivationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict activation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.clicks + this.limit) * 100) / 100;
  }

  copy(): StrictActivationException {
    return new StrictActivationException(
      this.code,
      this.name,
      this.archived,
      this.active,
      this.timezone,
      this.maximum,
      this.startsAt,
      this.limit,
      this.clicks,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict activation exception in status idle. */
export function newStrictActivationException(code: string, name: string): StrictActivationException {
  return new StrictActivationException(code, name, false, false, "", 0, 0, 0, 0, "", "idle");
}
