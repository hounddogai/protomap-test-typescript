import * as text from "../../../../kit/text.js";

/** Where a capped path milestone is in its life cycle. */
export type CappedPathMilestoneStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A capped path milestone. Its code is unique within a tenant. */
export class CappedPathMilestone {
  code: string;
  label: string;
  expiresAt: number;
  ownerId: string;
  approved: boolean;
  archived: boolean;
  sequence: number;
  status: CappedPathMilestoneStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    ownerId: string,
    approved: boolean,
    archived: boolean,
    sequence: number,
    status: CappedPathMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.approved = approved;
    this.archived = archived;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPathMilestoneStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPathMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped path milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.sequence + this.expiresAt) * 100) / 100;
  }

  copy(): CappedPathMilestone {
    return new CappedPathMilestone(
      this.code,
      this.label,
      this.expiresAt,
      this.ownerId,
      this.approved,
      this.archived,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped path milestone in status draft. */
export function newCappedPathMilestone(code: string, label: string): CappedPathMilestone {
  return new CappedPathMilestone(code, label, 0, "", false, false, 0, "draft");
}
