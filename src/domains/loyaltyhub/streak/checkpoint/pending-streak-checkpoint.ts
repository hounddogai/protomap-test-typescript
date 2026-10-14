/**
 * The pending streak checkpoint records of loyaltyhub's streak work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending streak checkpoint is in its life cycle. */
export type PendingStreakCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pending streak checkpoint. Its code is unique within a tenant. */
export class PendingStreakCheckpoint {
  code: string;
  label: string;
  maximum: number;
  graceDays: number;
  attempts: number;
  variant: string;
  phone: string;
  capacity: number;
  priority: number;
  segment: string;
  contactEmail: string;
  status: PendingStreakCheckpointStatus;

  constructor(
    code: string,
    label: string,
    maximum: number,
    graceDays: number,
    attempts: number,
    variant: string,
    phone: string,
    capacity: number,
    priority: number,
    segment: string,
    contactEmail: string,
    status: PendingStreakCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.variant = variant;
    this.phone = phone;
    this.capacity = capacity;
    this.priority = priority;
    this.segment = segment;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingStreakCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PendingStreakCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.priority + this.attempts) * 100) / 100;
  }

  copy(): PendingStreakCheckpoint {
    return new PendingStreakCheckpoint(
      this.code,
      this.label,
      this.maximum,
      this.graceDays,
      this.attempts,
      this.variant,
      this.phone,
      this.capacity,
      this.priority,
      this.segment,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending streak checkpoint in status proposed. */
export function newPendingStreakCheckpoint(code: string, label: string): PendingStreakCheckpoint {
  return new PendingStreakCheckpoint(code, label, 0, 0, 0, "", "", 0, 0, "", "", "proposed");
}
