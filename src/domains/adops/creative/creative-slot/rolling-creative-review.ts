import * as text from "../../../../kit/text.js";

/** Where a rolling creative review is in its life cycle. */
export type RollingCreativeReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling creative review. Its code is unique within a tenant. */
export class RollingCreativeReview {
  code: string;
  label: string;
  floorValue: number;
  graceDays: number;
  openRate: number;
  weight: number;
  status: RollingCreativeReviewStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    graceDays: number,
    openRate: number,
    weight: number,
    status: RollingCreativeReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
    this.openRate = openRate;
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

  canMoveTo(next: RollingCreativeReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingCreativeReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling creative review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.weight + this.graceDays) * 100) / 100;
  }

  copy(): RollingCreativeReview {
    return new RollingCreativeReview(
      this.code,
      this.label,
      this.floorValue,
      this.graceDays,
      this.openRate,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling creative review in status idle. */
export function newRollingCreativeReview(code: string, label: string): RollingCreativeReview {
  return new RollingCreativeReview(code, label, 0, 0, 0, 0, "idle");
}
