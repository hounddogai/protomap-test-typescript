/**
 * The placement estimate records of adops's placement work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement estimate is in its life cycle. */
export type PlacementEstimateStatus = "created" | "validated" | "published" | "retired";

/** The record of a placement estimate and its current status. */
export class PlacementEstimate {
  code: string;
  label: string;
  locale: string;
  budget: number;
  audienceId: string;
  endsAt: number;
  frequencyCap: number;
  title: string;
  checksum: string;
  status: PlacementEstimateStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    budget: number,
    audienceId: string,
    endsAt: number,
    frequencyCap: number,
    title: string,
    checksum: string,
    status: PlacementEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.budget = budget;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.frequencyCap = frequencyCap;
    this.title = title;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementEstimateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"placement estimate"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.endsAt) * 100) / 100;
  }

  copy(): PlacementEstimate {
    return new PlacementEstimate(
      this.code,
      this.label,
      this.locale,
      this.budget,
      this.audienceId,
      this.endsAt,
      this.frequencyCap,
      this.title,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement estimate in status created. */
export function newPlacementEstimate(code: string, label: string): PlacementEstimate {
  return new PlacementEstimate(code, label, "", 0, "", 0, 0, "", "", "created");
}
