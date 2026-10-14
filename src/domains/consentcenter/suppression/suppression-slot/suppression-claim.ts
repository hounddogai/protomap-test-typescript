import * as text from "../../../../kit/text.js";

/** Where a suppression claim is in its life cycle. */
export type SuppressionClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A suppression claim as the suppression team keeps it. */
export class SuppressionClaim {
  code: string;
  label: string;
  amount: number;
  region: string;
  notes: string;
  channel: string;
  createdAt: number;
  visible: boolean;
  batchSize: number;
  cost: number;
  status: SuppressionClaimStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    region: string,
    notes: string,
    channel: string,
    createdAt: number,
    visible: boolean,
    batchSize: number,
    cost: number,
    status: SuppressionClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.region = region;
    this.notes = notes;
    this.channel = channel;
    this.createdAt = createdAt;
    this.visible = visible;
    this.batchSize = batchSize;
    this.cost = cost;
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

  canMoveTo(next: SuppressionClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SuppressionClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.batchSize - this.amount) * 100) / 100;
  }

  copy(): SuppressionClaim {
    return new SuppressionClaim(
      this.code,
      this.label,
      this.amount,
      this.region,
      this.notes,
      this.channel,
      this.createdAt,
      this.visible,
      this.batchSize,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a suppression claim in status open. */
export function newSuppressionClaim(code: string, label: string): SuppressionClaim {
  return new SuppressionClaim(code, label, 0, "", "", "", 0, false, 0, 0, "open");
}
