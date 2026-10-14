import * as text from "../../../../kit/text.js";

/** Where a preference assignment is in its life cycle. */
export type PreferenceAssignmentStatus = "created" | "validated" | "published" | "retired";

/** A preference assignment. Its code is unique within a tenant. */
export class PreferenceAssignment {
  code: string;
  label: string;
  retries: number;
  clicks: number;
  createdAt: number;
  status: PreferenceAssignmentStatus;

  constructor(
    code: string,
    label: string,
    retries: number,
    clicks: number,
    createdAt: number,
    status: PreferenceAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.clicks = clicks;
    this.createdAt = createdAt;
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

  canMoveTo(next: PreferenceAssignmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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

  moveTo(next: PreferenceAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.retries * this.createdAt * 100) / 100;
  }

  copy(): PreferenceAssignment {
    return new PreferenceAssignment(this.code, this.label, this.retries, this.clicks, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a preference assignment in status created. */
export function newPreferenceAssignment(code: string, label: string): PreferenceAssignment {
  return new PreferenceAssignment(code, label, 0, 0, 0, "created");
}
