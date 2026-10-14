/**
 * The seasonal csat policy records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal csat policy is in its life cycle. */
export type SeasonalCsatPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal csat policy and its current status. */
export class SeasonalCsatPolicy {
  code: string;
  name: string;
  retries: number;
  channel: string;
  attempts: number;
  title: string;
  threshold: number;
  reviewer: string;
  endsAt: number;
  windowDays: number;
  status: SeasonalCsatPolicyStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    channel: string,
    attempts: number,
    title: string,
    threshold: number,
    reviewer: string,
    endsAt: number,
    windowDays: number,
    status: SeasonalCsatPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.channel = channel;
    this.attempts = attempts;
    this.title = title;
    this.threshold = threshold;
    this.reviewer = reviewer;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
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

  canMoveTo(next: SeasonalCsatPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCsatPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal csat policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveTotal(): number {
    return Math.round((this.threshold + this.retries) * 100) / 100;
  }

  copy(): SeasonalCsatPolicy {
    return new SeasonalCsatPolicy(
      this.code,
      this.name,
      this.retries,
      this.channel,
      this.attempts,
      this.title,
      this.threshold,
      this.reviewer,
      this.endsAt,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal csat policy in status planned. */
export function newSeasonalCsatPolicy(code: string, name: string): SeasonalCsatPolicy {
  return new SeasonalCsatPolicy(code, name, 0, "", 0, "", 0, "", 0, 0, "planned");
}
