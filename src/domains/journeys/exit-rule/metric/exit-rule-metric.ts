/**
 * The exit rule metric records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule metric is in its life cycle. */
export type ExitRuleMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a exit rule metric and its current status. */
export class ExitRuleMetric {
  code: string;
  label: string;
  ratio: number;
  bid: number;
  ownerId: string;
  audienceId: string;
  journeyId: string;
  version: number;
  expiresAt: number;
  status: ExitRuleMetricStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    bid: number,
    ownerId: string,
    audienceId: string,
    journeyId: string,
    version: number,
    expiresAt: number,
    status: ExitRuleMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.bid = bid;
    this.ownerId = ownerId;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.version = version;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.expiresAt + this.bid) * 100) / 100;
  }

  copy(): ExitRuleMetric {
    return new ExitRuleMetric(
      this.code,
      this.label,
      this.ratio,
      this.bid,
      this.ownerId,
      this.audienceId,
      this.journeyId,
      this.version,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a exit rule metric in status proposed. */
export function newExitRuleMetric(code: string, label: string): ExitRuleMetric {
  return new ExitRuleMetric(code, label, 0, 0, "", "", "", 0, 0, "proposed");
}
