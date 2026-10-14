import * as text from "../../../../kit/text.js";

/** Where a enrollment milestone is in its life cycle. */
export type EnrollmentMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** A enrollment milestone as the enrollment team keeps it. */
export class EnrollmentMilestone {
  code: string;
  label: string;
  ratio: number;
  updatedAt: number;
  variant: string;
  floorValue: number;
  status: EnrollmentMilestoneStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    updatedAt: number,
    variant: string,
    floorValue: number,
    status: EnrollmentMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.updatedAt = updatedAt;
    this.variant = variant;
    this.floorValue = floorValue;
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

  canMoveTo(next: EnrollmentMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: EnrollmentMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.updatedAt * this.ratio * 100) / 100;
  }

  copy(): EnrollmentMilestone {
    return new EnrollmentMilestone(
      this.code,
      this.label,
      this.ratio,
      this.updatedAt,
      this.variant,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a enrollment milestone in status requested. */
export function newEnrollmentMilestone(code: string, label: string): EnrollmentMilestone {
  return new EnrollmentMilestone(code, label, 0, 0, "", 0, "requested");
}
