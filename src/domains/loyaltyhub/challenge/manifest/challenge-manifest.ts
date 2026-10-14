/**
 * The challenge manifest records of loyaltyhub's challenge work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a challenge manifest is in its life cycle. */
export type ChallengeManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A challenge manifest. Its code is unique within a tenant. */
export class ChallengeManifest {
  code: string;
  title: string;
  approved: boolean;
  score: number;
  label: string;
  notes: string;
  reviewer: string;
  priority: number;
  region: string;
  status: ChallengeManifestStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    score: number,
    label: string,
    notes: string,
    reviewer: string,
    priority: number,
    region: string,
    status: ChallengeManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.score = score;
    this.label = label;
    this.notes = notes;
    this.reviewer = reviewer;
    this.priority = priority;
    this.region = region;
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

  canMoveTo(next: ChallengeManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
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

  moveTo(next: ChallengeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"challenge manifest"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.score * this.priority * 100) / 100;
  }

  copy(): ChallengeManifest {
    return new ChallengeManifest(
      this.code,
      this.title,
      this.approved,
      this.score,
      this.label,
      this.notes,
      this.reviewer,
      this.priority,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a challenge manifest in status new. */
export function newChallengeManifest(code: string, title: string): ChallengeManifest {
  return new ChallengeManifest(code, title, false, 0, "", "", "", 0, "", "new");
}
