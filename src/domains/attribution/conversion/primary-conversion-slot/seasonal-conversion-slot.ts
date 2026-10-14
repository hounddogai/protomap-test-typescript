/**
 * The seasonal conversion slot records of attribution's conversion work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal conversion slot is in its life cycle. */
export type SeasonalConversionSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a seasonal conversion slot and its current status. */
export class SeasonalConversionSlot {
  code: string;
  name: string;
  minimum: number;
  journeyId: string;
  segment: string;
  cost: number;
  status: SeasonalConversionSlotStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    journeyId: string,
    segment: string,
    cost: number,
    status: SeasonalConversionSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.journeyId = journeyId;
    this.segment = segment;
    this.cost = cost;
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

  canMoveTo(next: SeasonalConversionSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalConversionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal conversion slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netLoad(): number {
    return Math.round(this.cost * this.minimum * 100) / 100;
  }

  copy(): SeasonalConversionSlot {
    return new SeasonalConversionSlot(
      this.code,
      this.name,
      this.minimum,
      this.journeyId,
      this.segment,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal conversion slot in status open. */
export function newSeasonalConversionSlot(code: string, name: string): SeasonalConversionSlot {
  return new SeasonalConversionSlot(code, name, 0, "", "", 0, "open");
}
