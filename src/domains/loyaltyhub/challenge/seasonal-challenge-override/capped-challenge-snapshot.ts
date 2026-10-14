import * as text from "../../../../kit/text.js";

/** Where a capped challenge snapshot is in its life cycle. */
export type CappedChallengeSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One capped challenge snapshot, with what the planners need to act on it. */
export class CappedChallengeSnapshot {
  code: string;
  label: string;
  threshold: number;
  locale: string;
  frequencyCap: number;
  score: number;
  notes: string;
  status: CappedChallengeSnapshotStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    locale: string,
    frequencyCap: number,
    score: number,
    notes: string,
    status: CappedChallengeSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.score = score;
    this.notes = notes;
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

  canMoveTo(next: CappedChallengeSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedChallengeSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped challenge snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped challenge snapshot"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap - this.threshold) * 100) / 100;
  }

  copy(): CappedChallengeSnapshot {
    return new CappedChallengeSnapshot(
      this.code,
      this.label,
      this.threshold,
      this.locale,
      this.frequencyCap,
      this.score,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped challenge snapshot in status open. */
export function newCappedChallengeSnapshot(code: string, label: string): CappedChallengeSnapshot {
  return new CappedChallengeSnapshot(code, label, 0, "", 0, 0, "", "open");
}
