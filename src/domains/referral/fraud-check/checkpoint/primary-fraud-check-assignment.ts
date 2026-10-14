import * as text from "../../../../kit/text.js";

/** Where a primary fraud check assignment is in its life cycle. */
export type PrimaryFraudCheckAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary fraud check assignment. Its code is unique within a tenant. */
export class PrimaryFraudCheckAssignment {
  code: string;
  title: string;
  endsAt: number;
  threshold: number;
  description: string;
  status: PrimaryFraudCheckAssignmentStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    threshold: number,
    description: string,
    status: PrimaryFraudCheckAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.threshold = threshold;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryFraudCheckAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PrimaryFraudCheckAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary fraud check assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.threshold - this.endsAt) * 100) / 100;
  }

  copy(): PrimaryFraudCheckAssignment {
    return new PrimaryFraudCheckAssignment(
      this.code,
      this.title,
      this.endsAt,
      this.threshold,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary fraud check assignment in status new. */
export function newPrimaryFraudCheckAssignment(code: string, title: string): PrimaryFraudCheckAssignment {
  return new PrimaryFraudCheckAssignment(code, title, 0, 0, "", "new");
}
