/**
 * The weighted reward profile records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted reward profile is in its life cycle. */
export type WeightedRewardProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a weighted reward profile and its current status. */
export class WeightedRewardProfile {
  code: string;
  label: string;
  amount: number;
  visible: boolean;
  attributes: Map<string, string>;
  budget: number;
  contactEmail: string;
  retries: number;
  threshold: number;
  status: WeightedRewardProfileStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    visible: boolean,
    attributes: Map<string, string>,
    budget: number,
    contactEmail: string,
    retries: number,
    threshold: number,
    status: WeightedRewardProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.visible = visible;
    this.attributes = attributes;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.retries = retries;
    this.threshold = threshold;
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

  canMoveTo(next: WeightedRewardProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: WeightedRewardProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reward profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted reward profile"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): WeightedRewardProfile {
    return new WeightedRewardProfile(
      this.code,
      this.label,
      this.amount,
      this.visible,
      this.attributes,
      this.budget,
      this.contactEmail,
      this.retries,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted reward profile in status planned. */
export function newWeightedRewardProfile(code: string, label: string): WeightedRewardProfile {
  return new WeightedRewardProfile(code, label, 0, false, new Map<string, string>(), 0, "", 0, 0, "planned");
}
