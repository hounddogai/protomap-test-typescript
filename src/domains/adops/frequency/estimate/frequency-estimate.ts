/**
 * The frequency estimate records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency estimate is in its life cycle. */
export type FrequencyEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One frequency estimate, with what the planners need to act on it. */
export class FrequencyEstimate {
  code: string;
  label: string;
  audienceId: string;
  updatedAt: number;
  graceDays: number;
  phone: string;
  budget: number;
  status: FrequencyEstimateStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    updatedAt: number,
    graceDays: number,
    phone: string,
    budget: number,
    status: FrequencyEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.graceDays = graceDays;
    this.phone = phone;
    this.budget = budget;
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

  canMoveTo(next: FrequencyEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FrequencyEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.updatedAt) * 100) / 100;
  }

  copy(): FrequencyEstimate {
    return new FrequencyEstimate(
      this.code,
      this.label,
      this.audienceId,
      this.updatedAt,
      this.graceDays,
      this.phone,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a frequency estimate in status planned. */
export function newFrequencyEstimate(code: string, label: string): FrequencyEstimate {
  return new FrequencyEstimate(code, label, "", 0, 0, "", 0, "planned");
}
