import * as text from "../../../../kit/text.js";

/** Where a primary badge milestone is in its life cycle. */
export type PrimaryBadgeMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary badge milestone and its current status. */
export class PrimaryBadgeMilestone {
  code: string;
  name: string;
  createdAt: number;
  category: string;
  threshold: number;
  priority: number;
  startsAt: number;
  amount: number;
  revision: number;
  source: string;
  audienceId: string;
  status: PrimaryBadgeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    category: string,
    threshold: number,
    priority: number,
    startsAt: number,
    amount: number,
    revision: number,
    source: string,
    audienceId: string,
    status: PrimaryBadgeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.category = category;
    this.threshold = threshold;
    this.priority = priority;
    this.startsAt = startsAt;
    this.amount = amount;
    this.revision = revision;
    this.source = source;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryBadgeMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBadgeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary badge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.revision - this.startsAt) * 100) / 100;
  }

  copy(): PrimaryBadgeMilestone {
    return new PrimaryBadgeMilestone(
      this.code,
      this.name,
      this.createdAt,
      this.category,
      this.threshold,
      this.priority,
      this.startsAt,
      this.amount,
      this.revision,
      this.source,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary badge milestone in status requested. */
export function newPrimaryBadgeMilestone(code: string, name: string): PrimaryBadgeMilestone {
  return new PrimaryBadgeMilestone(code, name, 0, "", 0, 0, 0, 0, 0, "", "", "requested");
}
