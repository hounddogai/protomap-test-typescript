/**
 * The invite reservation records of referral's invite work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite reservation is in its life cycle. */
export type InviteReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A invite reservation. Its code is unique within a tenant. */
export class InviteReservation {
  code: string;
  title: string;
  limit: number;
  region: string;
  externalRef: string;
  durationMinutes: number;
  segment: string;
  variant: string;
  phone: string;
  timezone: string;
  status: InviteReservationStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    region: string,
    externalRef: string,
    durationMinutes: number,
    segment: string,
    variant: string,
    phone: string,
    timezone: string,
    status: InviteReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.region = region;
    this.externalRef = externalRef;
    this.durationMinutes = durationMinutes;
    this.segment = segment;
    this.variant = variant;
    this.phone = phone;
    this.timezone = timezone;
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

  canMoveTo(next: InviteReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.durationMinutes + this.limit) * 100) / 100;
  }

  copy(): InviteReservation {
    return new InviteReservation(
      this.code,
      this.title,
      this.limit,
      this.region,
      this.externalRef,
      this.durationMinutes,
      this.segment,
      this.variant,
      this.phone,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a invite reservation in status idle. */
export function newInviteReservation(code: string, title: string): InviteReservation {
  return new InviteReservation(code, title, 0, "", "", 0, "", "", "", "", "idle");
}
