import * as text from "../../../../kit/text.js";

/** Where a fallback challenge snapshot is in its life cycle. */
export type FallbackChallengeSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback challenge snapshot as the challenge team keeps it. */
export class FallbackChallengeSnapshot {
  code: string;
  label: string;
  variant: string;
  ownerId: string;
  country: string;
  score: number;
  status: FallbackChallengeSnapshotStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    ownerId: string,
    country: string,
    score: number,
    status: FallbackChallengeSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.ownerId = ownerId;
    this.country = country;
    this.score = score;
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

  canMoveTo(next: FallbackChallengeSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackChallengeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback challenge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FallbackChallengeSnapshot {
    return new FallbackChallengeSnapshot(
      this.code,
      this.label,
      this.variant,
      this.ownerId,
      this.country,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback challenge snapshot in status proposed. */
export function newFallbackChallengeSnapshot(code: string, label: string): FallbackChallengeSnapshot {
  return new FallbackChallengeSnapshot(code, label, "", "", "", 0, "proposed");
}
