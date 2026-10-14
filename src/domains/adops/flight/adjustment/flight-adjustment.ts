/**
 * The flight adjustment records of adops's flight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a flight adjustment is in its life cycle. */
export type FlightAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A flight adjustment as the flight team keeps it. */
export class FlightAdjustment {
  code: string;
  name: string;
  utmSource: string;
  ownerId: string;
  label: string;
  quantity: number;
  audienceId: string;
  variant: string;
  version: number;
  ratio: number;
  bid: number;
  status: FlightAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    ownerId: string,
    label: string,
    quantity: number,
    audienceId: string,
    variant: string,
    version: number,
    ratio: number,
    bid: number,
    status: FlightAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.label = label;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.variant = variant;
    this.version = version;
    this.ratio = ratio;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FlightAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round(this.quantity * this.version * 100) / 100;
  }

  copy(): FlightAdjustment {
    return new FlightAdjustment(
      this.code,
      this.name,
      this.utmSource,
      this.ownerId,
      this.label,
      this.quantity,
      this.audienceId,
      this.variant,
      this.version,
      this.ratio,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a flight adjustment in status open. */
export function newFlightAdjustment(code: string, name: string): FlightAdjustment {
  return new FlightAdjustment(code, name, "", "", "", 0, "", "", 0, 0, 0, "open");
}
