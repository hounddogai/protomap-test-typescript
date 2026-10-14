/**
 * The lenient pacing forecast records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient pacing forecast is in its life cycle. */
export type LenientPacingForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A lenient pacing forecast as the pacing team keeps it. */
export class LenientPacingForecast {
  code: string;
  name: string;
  floorValue: number;
  quantity: number;
  audienceId: string;
  title: string;
  status: LenientPacingForecastStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    quantity: number,
    audienceId: string,
    title: string,
    status: LenientPacingForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.audienceId = audienceId;
    this.title = title;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientPacingForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientPacingForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient pacing forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round((this.quantity + this.floorValue) * 100) / 100;
  }

  copy(): LenientPacingForecast {
    return new LenientPacingForecast(
      this.code,
      this.name,
      this.floorValue,
      this.quantity,
      this.audienceId,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient pacing forecast in status planned. */
export function newLenientPacingForecast(code: string, name: string): LenientPacingForecast {
  return new LenientPacingForecast(code, name, 0, 0, "", "", "planned");
}
