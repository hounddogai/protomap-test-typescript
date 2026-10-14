import * as text from "../../../../kit/text.js";

/** Where a seasonal wait adjustment is in its life cycle. */
export type SeasonalWaitAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal wait adjustment. Its code is unique within a tenant. */
export class SeasonalWaitAdjustment {
  code: string;
  label: string;
  minimum: number;
  revision: number;
  updatedAt: number;
  visible: boolean;
  amount: number;
  status: SeasonalWaitAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    revision: number,
    updatedAt: number,
    visible: boolean,
    amount: number,
    status: SeasonalWaitAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.visible = visible;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalWaitAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalWaitAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal wait adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"seasonal wait adjustment"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round(this.minimum * this.updatedAt * 100) / 100;
  }

  copy(): SeasonalWaitAdjustment {
    return new SeasonalWaitAdjustment(
      this.code,
      this.label,
      this.minimum,
      this.revision,
      this.updatedAt,
      this.visible,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal wait adjustment in status open. */
export function newSeasonalWaitAdjustment(code: string, label: string): SeasonalWaitAdjustment {
  return new SeasonalWaitAdjustment(code, label, 0, 0, 0, false, 0, "open");
}
