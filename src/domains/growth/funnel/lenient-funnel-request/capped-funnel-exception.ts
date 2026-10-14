import * as text from "../../../../kit/text.js";

/** Where a capped funnel exception is in its life cycle. */
export type CappedFunnelExceptionStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped funnel exception and its current status. */
export class CappedFunnelException {
  code: string;
  label: string;
  approved: boolean;
  limit: number;
  description: string;
  budget: number;
  revision: number;
  endsAt: number;
  status: CappedFunnelExceptionStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    limit: number,
    description: string,
    budget: number,
    revision: number,
    endsAt: number,
    status: CappedFunnelExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.limit = limit;
    this.description = description;
    this.budget = budget;
    this.revision = revision;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFunnelExceptionStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedFunnelExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped funnel exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"capped funnel exception"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.revision + this.budget) * 100) / 100;
  }

  copy(): CappedFunnelException {
    return new CappedFunnelException(
      this.code,
      this.label,
      this.approved,
      this.limit,
      this.description,
      this.budget,
      this.revision,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped funnel exception in status planned. */
export function newCappedFunnelException(code: string, label: string): CappedFunnelException {
  return new CappedFunnelException(code, label, false, 0, "", 0, 0, 0, "planned");
}
