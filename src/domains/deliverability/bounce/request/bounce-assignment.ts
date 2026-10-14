import * as text from "../../../../kit/text.js";

/** Where a bounce assignment is in its life cycle. */
export type BounceAssignmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a bounce assignment and its current status. */
export class BounceAssignment {
  code: string;
  title: string;
  expiresAt: number;
  budget: number;
  pinned: boolean;
  limit: number;
  archived: boolean;
  label: string;
  campaignRef: string;
  status: BounceAssignmentStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    budget: number,
    pinned: boolean,
    limit: number,
    archived: boolean,
    label: string,
    campaignRef: string,
    status: BounceAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.budget = budget;
    this.pinned = pinned;
    this.limit = limit;
    this.archived = archived;
    this.label = label;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: BounceAssignmentStatus): boolean {
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
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BounceAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"bounce assignment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.budget * this.limit * 100) / 100;
  }

  copy(): BounceAssignment {
    return new BounceAssignment(
      this.code,
      this.title,
      this.expiresAt,
      this.budget,
      this.pinned,
      this.limit,
      this.archived,
      this.label,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a bounce assignment in status created. */
export function newBounceAssignment(code: string, title: string): BounceAssignment {
  return new BounceAssignment(code, title, 0, 0, false, 0, false, "", "", "created");
}
