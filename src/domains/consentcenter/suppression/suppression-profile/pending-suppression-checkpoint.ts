import * as text from "../../../../kit/text.js";

/** Where a pending suppression checkpoint is in its life cycle. */
export type PendingSuppressionCheckpointStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending suppression checkpoint and its current status. */
export class PendingSuppressionCheckpoint {
  code: string;
  label: string;
  amount: number;
  category: string;
  archived: boolean;
  externalRef: string;
  approved: boolean;
  threshold: number;
  conversionRate: number;
  discount: number;
  status: PendingSuppressionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    category: string,
    archived: boolean,
    externalRef: string,
    approved: boolean,
    threshold: number,
    conversionRate: number,
    discount: number,
    status: PendingSuppressionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.category = category;
    this.archived = archived;
    this.externalRef = externalRef;
    this.approved = approved;
    this.threshold = threshold;
    this.conversionRate = conversionRate;
    this.discount = discount;
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

  canMoveTo(next: PendingSuppressionCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSuppressionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending suppression checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.discount - this.threshold) * 100) / 100;
  }

  copy(): PendingSuppressionCheckpoint {
    return new PendingSuppressionCheckpoint(
      this.code,
      this.label,
      this.amount,
      this.category,
      this.archived,
      this.externalRef,
      this.approved,
      this.threshold,
      this.conversionRate,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending suppression checkpoint in status created. */
export function newPendingSuppressionCheckpoint(code: string, label: string): PendingSuppressionCheckpoint {
  return new PendingSuppressionCheckpoint(code, label, 0, "", false, "", false, 0, 0, 0, "created");
}
