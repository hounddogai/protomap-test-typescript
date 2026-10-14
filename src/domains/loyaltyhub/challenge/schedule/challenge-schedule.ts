/**
 * The challenge schedule records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge schedule is in its life cycle. */
export type ChallengeScheduleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a challenge schedule and its current status. */
export class ChallengeSchedule {
  code: string;
  label: string;
  title: string;
  attributes: Map<string, string>;
  maximum: number;
  retries: number;
  minimum: number;
  impressions: number;
  floorValue: number;
  weight: number;
  status: ChallengeScheduleStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    attributes: Map<string, string>,
    maximum: number,
    retries: number,
    minimum: number,
    impressions: number,
    floorValue: number,
    weight: number,
    status: ChallengeScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.attributes = attributes;
    this.maximum = maximum;
    this.retries = retries;
    this.minimum = minimum;
    this.impressions = impressions;
    this.floorValue = floorValue;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ChallengeScheduleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ChallengeScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"challenge schedule"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.maximum - this.minimum) * 100) / 100;
  }

  copy(): ChallengeSchedule {
    return new ChallengeSchedule(
      this.code,
      this.label,
      this.title,
      this.attributes,
      this.maximum,
      this.retries,
      this.minimum,
      this.impressions,
      this.floorValue,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a challenge schedule in status idle. */
export function newChallengeSchedule(code: string, label: string): ChallengeSchedule {
  return new ChallengeSchedule(code, label, "", new Map<string, string>(), 0, 0, 0, 0, 0, 0, "idle");
}
