import * as text from "../../../../kit/text.js";

/** Where a rolling placement audit is in its life cycle. */
export type RollingPlacementAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a rolling placement audit and its current status. */
export class RollingPlacementAudit {
  code: string;
  label: string;
  limit: number;
  attempts: number;
  margin: number;
  openRate: number;
  priority: number;
  ownerId: string;
  status: RollingPlacementAuditStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    attempts: number,
    margin: number,
    openRate: number,
    priority: number,
    ownerId: string,
    status: RollingPlacementAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.attempts = attempts;
    this.margin = margin;
    this.openRate = openRate;
    this.priority = priority;
    this.ownerId = ownerId;
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

  canMoveTo(next: RollingPlacementAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPlacementAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling placement audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling placement audit"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.limit + this.priority) * 100) / 100;
  }

  copy(): RollingPlacementAudit {
    return new RollingPlacementAudit(
      this.code,
      this.label,
      this.limit,
      this.attempts,
      this.margin,
      this.openRate,
      this.priority,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling placement audit in status draft. */
export function newRollingPlacementAudit(code: string, label: string): RollingPlacementAudit {
  return new RollingPlacementAudit(code, label, 0, 0, 0, 0, 0, "", "draft");
}
