/**
 * The global redemption estimate records of loyaltyhub's redemption work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global redemption estimate is in its life cycle. */
export type GlobalRedemptionEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a global redemption estimate and its current status. */
export class GlobalRedemptionEstimate {
  code: string;
  name: string;
  ratio: number;
  channel: string;
  country: string;
  conversionRate: number;
  externalRef: string;
  status: GlobalRedemptionEstimateStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    channel: string,
    country: string,
    conversionRate: number,
    externalRef: string,
    status: GlobalRedemptionEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.channel = channel;
    this.country = country;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
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

  canMoveTo(next: GlobalRedemptionEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalRedemptionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global redemption estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.ratio - this.conversionRate) * 100) / 100;
  }

  copy(): GlobalRedemptionEstimate {
    return new GlobalRedemptionEstimate(
      this.code,
      this.name,
      this.ratio,
      this.channel,
      this.country,
      this.conversionRate,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a global redemption estimate in status planned. */
export function newGlobalRedemptionEstimate(code: string, name: string): GlobalRedemptionEstimate {
  return new GlobalRedemptionEstimate(code, name, 0, "", "", 0, "", "planned");
}
