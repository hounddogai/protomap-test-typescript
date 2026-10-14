import * as text from "../../../../kit/text.js";

/** Where a fraud check batch is in its life cycle. */
export type FraudCheckBatchStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fraud check batch as the fraud check team keeps it. */
export class FraudCheckBatch {
  code: string;
  label: string;
  variant: string;
  version: number;
  durationMinutes: number;
  updatedAt: number;
  campaignRef: string;
  status: FraudCheckBatchStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    version: number,
    durationMinutes: number,
    updatedAt: number,
    campaignRef: string,
    status: FraudCheckBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.version = version;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FraudCheckBatchStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FraudCheckBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round((this.durationMinutes - this.updatedAt) * 100) / 100;
  }

  copy(): FraudCheckBatch {
    return new FraudCheckBatch(
      this.code,
      this.label,
      this.variant,
      this.version,
      this.durationMinutes,
      this.updatedAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check batch in status open. */
export function newFraudCheckBatch(code: string, label: string): FraudCheckBatch {
  return new FraudCheckBatch(code, label, "", 0, 0, 0, "", "open");
}
