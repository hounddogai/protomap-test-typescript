import * as text from "../../../../kit/text.js";

/** Where a lenient proof threshold is in its life cycle. */
export type LenientProofThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient proof threshold and its current status. */
export class LenientProofThreshold {
  code: string;
  title: string;
  weight: number;
  expiresAt: number;
  batchSize: number;
  contactEmail: string;
  quantity: number;
  label: string;
  minimum: number;
  margin: number;
  attempts: number;
  status: LenientProofThresholdStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    expiresAt: number,
    batchSize: number,
    contactEmail: string,
    quantity: number,
    label: string,
    minimum: number,
    margin: number,
    attempts: number,
    status: LenientProofThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.quantity = quantity;
    this.label = label;
    this.minimum = minimum;
    this.margin = margin;
    this.attempts = attempts;
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

  canMoveTo(next: LenientProofThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientProofThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient proof threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedExposure(): number {
    return Math.round((this.expiresAt - this.attempts) * 100) / 100;
  }

  copy(): LenientProofThreshold {
    return new LenientProofThreshold(
      this.code,
      this.title,
      this.weight,
      this.expiresAt,
      this.batchSize,
      this.contactEmail,
      this.quantity,
      this.label,
      this.minimum,
      this.margin,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient proof threshold in status created. */
export function newLenientProofThreshold(code: string, title: string): LenientProofThreshold {
  return new LenientProofThreshold(code, title, 0, 0, 0, "", 0, "", 0, 0, 0, "created");
}
