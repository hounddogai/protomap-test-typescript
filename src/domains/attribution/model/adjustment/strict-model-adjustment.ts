/**
 * The strict model adjustment records of attribution's model work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict model adjustment is in its life cycle. */
export type StrictModelAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict model adjustment, with what the planners need to act on it. */
export class StrictModelAdjustment {
  code: string;
  name: string;
  attributes: Map<string, string>;
  floorValue: number;
  sendAt: number;
  endsAt: number;
  score: number;
  phone: string;
  status: StrictModelAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    floorValue: number,
    sendAt: number,
    endsAt: number,
    score: number,
    phone: string,
    status: StrictModelAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.score = score;
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

  canMoveTo(next: StrictModelAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictModelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict model adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round(this.score * this.endsAt * 100) / 100;
  }

  copy(): StrictModelAdjustment {
    return new StrictModelAdjustment(
      this.code,
      this.name,
      this.attributes,
      this.floorValue,
      this.sendAt,
      this.endsAt,
      this.score,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict model adjustment in status draft. */
export function newStrictModelAdjustment(code: string, name: string): StrictModelAdjustment {
  return new StrictModelAdjustment(code, name, new Map<string, string>(), 0, 0, 0, 0, "", "draft");
}
