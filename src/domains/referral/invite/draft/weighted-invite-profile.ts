import * as text from "../../../../kit/text.js";

/** Where a weighted invite profile is in its life cycle. */
export type WeightedInviteProfileStatus = "created" | "validated" | "published" | "retired";

/** The record of a weighted invite profile and its current status. */
export class WeightedInviteProfile {
  code: string;
  label: string;
  segment: string;
  checksum: string;
  weight: number;
  minimum: number;
  attempts: number;
  status: WeightedInviteProfileStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    checksum: string,
    weight: number,
    minimum: number,
    attempts: number,
    status: WeightedInviteProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.checksum = checksum;
    this.weight = weight;
    this.minimum = minimum;
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

  canMoveTo(next: WeightedInviteProfileStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedInviteProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted invite profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveLoad(): number {
    return Math.round((this.weight - this.minimum) * 100) / 100;
  }

  copy(): WeightedInviteProfile {
    return new WeightedInviteProfile(
      this.code,
      this.label,
      this.segment,
      this.checksum,
      this.weight,
      this.minimum,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a weighted invite profile in status created. */
export function newWeightedInviteProfile(code: string, label: string): WeightedInviteProfile {
  return new WeightedInviteProfile(code, label, "", "", 0, 0, 0, "created");
}
