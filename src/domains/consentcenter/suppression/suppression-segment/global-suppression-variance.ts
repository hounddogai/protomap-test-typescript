import * as text from "../../../../kit/text.js";

/** Where a global suppression variance is in its life cycle. */
export type GlobalSuppressionVarianceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a global suppression variance and its current status. */
export class GlobalSuppressionVariance {
  code: string;
  label: string;
  floorValue: number;
  segment: string;
  expiresAt: number;
  status: GlobalSuppressionVarianceStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    segment: string,
    expiresAt: number,
    status: GlobalSuppressionVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.segment = segment;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: GlobalSuppressionVarianceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalSuppressionVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global suppression variance"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.expiresAt * this.floorValue * 100) / 100;
  }

  copy(): GlobalSuppressionVariance {
    return new GlobalSuppressionVariance(
      this.code,
      this.label,
      this.floorValue,
      this.segment,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a global suppression variance in status planned. */
export function newGlobalSuppressionVariance(code: string, label: string): GlobalSuppressionVariance {
  return new GlobalSuppressionVariance(code, label, 0, "", 0, "planned");
}
