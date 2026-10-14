import * as text from "../../../../kit/text.js";

/** Where a branch claim is in its life cycle. */
export type BranchClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a branch claim and its current status. */
export class BranchClaim {
  code: string;
  name: string;
  durationMinutes: number;
  attempts: number;
  journeyId: string;
  phone: string;
  createdAt: number;
  priority: number;
  label: string;
  margin: number;
  threshold: number;
  status: BranchClaimStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    attempts: number,
    journeyId: string,
    phone: string,
    createdAt: number,
    priority: number,
    label: string,
    margin: number,
    threshold: number,
    status: BranchClaimStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.journeyId = journeyId;
    this.phone = phone;
    this.createdAt = createdAt;
    this.priority = priority;
    this.label = label;
    this.margin = margin;
    this.threshold = threshold;
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

  canMoveTo(next: BranchClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: BranchClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"branch claim"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.attempts * 100) / 100;
  }

  copy(): BranchClaim {
    return new BranchClaim(
      this.code,
      this.name,
      this.durationMinutes,
      this.attempts,
      this.journeyId,
      this.phone,
      this.createdAt,
      this.priority,
      this.label,
      this.margin,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a branch claim in status draft. */
export function newBranchClaim(code: string, name: string): BranchClaim {
  return new BranchClaim(code, name, 0, 0, "", "", 0, 0, "", 0, 0, "draft");
}
