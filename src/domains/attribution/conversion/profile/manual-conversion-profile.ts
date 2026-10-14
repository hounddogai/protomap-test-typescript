/**
 * The manual conversion profile records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual conversion profile is in its life cycle. */
export type ManualConversionProfileStatus = "created" | "validated" | "published" | "retired";

/** One manual conversion profile, with what the planners need to act on it. */
export class ManualConversionProfile {
  code: string;
  name: string;
  startsAt: number;
  reviewer: string;
  quantity: number;
  revision: number;
  batchSize: number;
  minimum: number;
  category: string;
  floorValue: number;
  status: ManualConversionProfileStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    reviewer: string,
    quantity: number,
    revision: number,
    batchSize: number,
    minimum: number,
    category: string,
    floorValue: number,
    status: ManualConversionProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.revision = revision;
    this.batchSize = batchSize;
    this.minimum = minimum;
    this.category = category;
    this.floorValue = floorValue;
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

  canMoveTo(next: ManualConversionProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ManualConversionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual conversion profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"manual conversion profile"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.batchSize * this.minimum * 100) / 100;
  }

  copy(): ManualConversionProfile {
    return new ManualConversionProfile(
      this.code,
      this.name,
      this.startsAt,
      this.reviewer,
      this.quantity,
      this.revision,
      this.batchSize,
      this.minimum,
      this.category,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual conversion profile in status created. */
export function newManualConversionProfile(code: string, name: string): ManualConversionProfile {
  return new ManualConversionProfile(code, name, 0, "", 0, 0, 0, 0, "", 0, "created");
}
