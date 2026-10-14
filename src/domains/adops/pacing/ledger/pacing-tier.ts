import * as text from "../../../../kit/text.js";

/** Where a pacing tier is in its life cycle. */
export type PacingTierStatus = "created" | "validated" | "published" | "retired";

/** The record of a pacing tier and its current status. */
export class PacingTier {
  code: string;
  label: string;
  timezone: string;
  budget: number;
  approved: boolean;
  discount: number;
  updatedAt: number;
  name: string;
  status: PacingTierStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    budget: number,
    approved: boolean,
    discount: number,
    updatedAt: number,
    name: string,
    status: PacingTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.budget = budget;
    this.approved = approved;
    this.discount = discount;
    this.updatedAt = updatedAt;
    this.name = name;
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

  canMoveTo(next: PacingTierStatus): boolean {
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

  moveTo(next: PacingTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedValue(): number {
    return Math.round(this.discount * this.budget * 100) / 100;
  }

  copy(): PacingTier {
    return new PacingTier(
      this.code,
      this.label,
      this.timezone,
      this.budget,
      this.approved,
      this.discount,
      this.updatedAt,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pacing tier in status created. */
export function newPacingTier(code: string, label: string): PacingTier {
  return new PacingTier(code, label, "", 0, false, 0, 0, "", "created");
}
