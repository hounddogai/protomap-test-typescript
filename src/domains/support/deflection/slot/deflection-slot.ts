/**
 * The deflection slot records of support's deflection work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a deflection slot is in its life cycle. */
export type DeflectionSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a deflection slot and its current status. */
export class DeflectionSlot {
  code: string;
  name: string;
  windowDays: number;
  region: string;
  createdAt: number;
  timezone: string;
  revision: number;
  phone: string;
  status: DeflectionSlotStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    region: string,
    createdAt: number,
    timezone: string,
    revision: number,
    phone: string,
    status: DeflectionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.region = region;
    this.createdAt = createdAt;
    this.timezone = timezone;
    this.revision = revision;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DeflectionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.windowDays * this.revision * 100) / 100;
  }

  copy(): DeflectionSlot {
    return new DeflectionSlot(
      this.code,
      this.name,
      this.windowDays,
      this.region,
      this.createdAt,
      this.timezone,
      this.revision,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a deflection slot in status draft. */
export function newDeflectionSlot(code: string, name: string): DeflectionSlot {
  return new DeflectionSlot(code, name, 0, "", 0, "", 0, "", "draft");
}
