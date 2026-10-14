import * as text from "../../../../kit/text.js";

/** Where a batched proof profile is in its life cycle. */
export type BatchedProofProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a batched proof profile and its current status. */
export class BatchedProofProfile {
  code: string;
  label: string;
  ratio: number;
  durationMinutes: number;
  minimum: number;
  country: string;
  attempts: number;
  status: BatchedProofProfileStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    durationMinutes: number,
    minimum: number,
    country: string,
    attempts: number,
    status: BatchedProofProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.country = country;
    this.attempts = attempts;
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

  canMoveTo(next: BatchedProofProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedProofProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched proof profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netExposure(): number {
    return Math.round(this.attempts * this.minimum * 100) / 100;
  }

  copy(): BatchedProofProfile {
    return new BatchedProofProfile(
      this.code,
      this.label,
      this.ratio,
      this.durationMinutes,
      this.minimum,
      this.country,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched proof profile in status planned. */
export function newBatchedProofProfile(code: string, label: string): BatchedProofProfile {
  return new BatchedProofProfile(code, label, 0, 0, 0, "", 0, "planned");
}
