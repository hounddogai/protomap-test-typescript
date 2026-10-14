import * as text from "../../../../kit/text.js";

/** Where a preference target is in its life cycle. */
export type PreferenceTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A preference target as the preference team keeps it. */
export class PreferenceTarget {
  code: string;
  label: string;
  channel: string;
  approved: boolean;
  notes: string;
  score: number;
  status: PreferenceTargetStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    approved: boolean,
    notes: string,
    score: number,
    status: PreferenceTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.approved = approved;
    this.notes = notes;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceTargetStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PreferenceTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PreferenceTarget {
    return new PreferenceTarget(
      this.code,
      this.label,
      this.channel,
      this.approved,
      this.notes,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a preference target in status new. */
export function newPreferenceTarget(code: string, label: string): PreferenceTarget {
  return new PreferenceTarget(code, label, "", false, "", 0, "new");
}
