/**
 * The tiered touchpoint preference records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint preference is in its life cycle. */
export type TieredTouchpointPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a tiered touchpoint preference and its current status. */
export class TieredTouchpointPreference {
  code: string;
  name: string;
  score: number;
  cost: number;
  utmSource: string;
  country: string;
  quantity: number;
  channel: string;
  status: TieredTouchpointPreferenceStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    cost: number,
    utmSource: string,
    country: string,
    quantity: number,
    channel: string,
    status: TieredTouchpointPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.cost = cost;
    this.utmSource = utmSource;
    this.country = country;
    this.quantity = quantity;
    this.channel = channel;
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

  canMoveTo(next: TieredTouchpointPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: TieredTouchpointPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.quantity + this.cost) * 100) / 100;
  }

  copy(): TieredTouchpointPreference {
    return new TieredTouchpointPreference(
      this.code,
      this.name,
      this.score,
      this.cost,
      this.utmSource,
      this.country,
      this.quantity,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered touchpoint preference in status planned. */
export function newTieredTouchpointPreference(code: string, name: string): TieredTouchpointPreference {
  return new TieredTouchpointPreference(code, name, 0, 0, "", "", 0, "", "planned");
}
