import * as text from "../../../../kit/text.js";

/** Where a pending credit variance is in its life cycle. */
export type PendingCreditVarianceStatus = "created" | "validated" | "published" | "retired";

/** One pending credit variance, with what the planners need to act on it. */
export class PendingCreditVariance {
  code: string;
  label: string;
  tags: string[];
  sequence: number;
  discount: number;
  currency: string;
  notes: string;
  windowDays: number;
  status: PendingCreditVarianceStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    sequence: number,
    discount: number,
    currency: string,
    notes: string,
    windowDays: number,
    status: PendingCreditVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.sequence = sequence;
    this.discount = discount;
    this.currency = currency;
    this.notes = notes;
    this.windowDays = windowDays;
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

  canMoveTo(next: PendingCreditVarianceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingCreditVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending credit variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.windowDays + this.discount) * 100) / 100;
  }

  copy(): PendingCreditVariance {
    return new PendingCreditVariance(
      this.code,
      this.label,
      this.tags,
      this.sequence,
      this.discount,
      this.currency,
      this.notes,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending credit variance in status created. */
export function newPendingCreditVariance(code: string, label: string): PendingCreditVariance {
  return new PendingCreditVariance(code, label, [], 0, 0, "", "", 0, "created");
}
