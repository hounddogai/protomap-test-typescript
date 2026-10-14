/**
 * The weighted mention profile records of social's mention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted mention profile is in its life cycle. */
export type WeightedMentionProfileStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted mention profile as the mention team keeps it. */
export class WeightedMentionProfile {
  code: string;
  title: string;
  notes: string;
  journeyId: string;
  name: string;
  score: number;
  status: WeightedMentionProfileStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    journeyId: string,
    name: string,
    score: number,
    status: WeightedMentionProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.journeyId = journeyId;
    this.name = name;
    this.score = score;
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

  canMoveTo(next: WeightedMentionProfileStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedMentionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"weighted mention profile"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedMentionProfile {
    return new WeightedMentionProfile(
      this.code,
      this.title,
      this.notes,
      this.journeyId,
      this.name,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a weighted mention profile in status planned. */
export function newWeightedMentionProfile(code: string, title: string): WeightedMentionProfile {
  return new WeightedMentionProfile(code, title, "", "", "", 0, "planned");
}
