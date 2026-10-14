import * as text from "../../../../kit/text.js";

/** Where a legacy reputation assignment is in its life cycle. */
export type LegacyReputationAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A legacy reputation assignment. Its code is unique within a tenant. */
export class LegacyReputationAssignment {
  code: string;
  label: string;
  expiresAt: number;
  windowDays: number;
  title: string;
  segment: string;
  status: LegacyReputationAssignmentStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    windowDays: number,
    title: string,
    segment: string,
    status: LegacyReputationAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.windowDays = windowDays;
    this.title = title;
    this.segment = segment;
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

  canMoveTo(next: LegacyReputationAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyReputationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reputation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedExposure(): number {
    return Math.round((this.windowDays - this.expiresAt) * 100) / 100;
  }

  copy(): LegacyReputationAssignment {
    return new LegacyReputationAssignment(
      this.code,
      this.label,
      this.expiresAt,
      this.windowDays,
      this.title,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy reputation assignment in status created. */
export function newLegacyReputationAssignment(code: string, label: string): LegacyReputationAssignment {
  return new LegacyReputationAssignment(code, label, 0, 0, "", "", "created");
}
