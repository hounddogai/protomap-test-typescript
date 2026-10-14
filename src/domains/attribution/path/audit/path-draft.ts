import * as text from "../../../../kit/text.js";

/** Where a path draft is in its life cycle. */
export type PathDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A path draft. Its code is unique within a tenant. */
export class PathDraft {
  code: string;
  name: string;
  unit: string;
  reviewer: string;
  batchSize: number;
  expiresAt: number;
  status: PathDraftStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    reviewer: string,
    batchSize: number,
    expiresAt: number,
    status: PathDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.reviewer = reviewer;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PathDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.expiresAt - this.batchSize) * 100) / 100;
  }

  copy(): PathDraft {
    return new PathDraft(this.code, this.name, this.unit, this.reviewer, this.batchSize, this.expiresAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a path draft in status proposed. */
export function newPathDraft(code: string, name: string): PathDraft {
  return new PathDraft(code, name, "", "", 0, 0, "proposed");
}
