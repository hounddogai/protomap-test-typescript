import * as text from "../../../../kit/text.js";

/** Where a suppression adjustment is in its life cycle. */
export type SuppressionAdjustmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A suppression adjustment as the suppression team keeps it. */
export class SuppressionAdjustment {
  code: string;
  title: string;
  source: string;
  budget: number;
  attempts: number;
  variant: string;
  campaignRef: string;
  status: SuppressionAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    budget: number,
    attempts: number,
    variant: string,
    campaignRef: string,
    status: SuppressionAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.budget = budget;
    this.attempts = attempts;
    this.variant = variant;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionAdjustmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SuppressionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression adjustment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.attempts) * 100) / 100;
  }

  copy(): SuppressionAdjustment {
    return new SuppressionAdjustment(
      this.code,
      this.title,
      this.source,
      this.budget,
      this.attempts,
      this.variant,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a suppression adjustment in status requested. */
export function newSuppressionAdjustment(code: string, title: string): SuppressionAdjustment {
  return new SuppressionAdjustment(code, title, "", 0, 0, "", "", "requested");
}
