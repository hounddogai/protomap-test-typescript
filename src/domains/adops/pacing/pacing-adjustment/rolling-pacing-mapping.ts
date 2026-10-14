import * as text from "../../../../kit/text.js";

/** Where a rolling pacing mapping is in its life cycle. */
export type RollingPacingMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling pacing mapping. Its code is unique within a tenant. */
export class RollingPacingMapping {
  code: string;
  label: string;
  approved: boolean;
  updatedAt: number;
  description: string;
  batchSize: number;
  active: boolean;
  limit: number;
  status: RollingPacingMappingStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    updatedAt: number,
    description: string,
    batchSize: number,
    active: boolean,
    limit: number,
    status: RollingPacingMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.updatedAt = updatedAt;
    this.description = description;
    this.batchSize = batchSize;
    this.active = active;
    this.limit = limit;
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

  canMoveTo(next: RollingPacingMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingPacingMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling pacing mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"rolling pacing mapping"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.limit + this.batchSize) * 100) / 100;
  }

  copy(): RollingPacingMapping {
    return new RollingPacingMapping(
      this.code,
      this.label,
      this.approved,
      this.updatedAt,
      this.description,
      this.batchSize,
      this.active,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a rolling pacing mapping in status open. */
export function newRollingPacingMapping(code: string, label: string): RollingPacingMapping {
  return new RollingPacingMapping(code, label, false, 0, "", 0, false, 0, "open");
}
