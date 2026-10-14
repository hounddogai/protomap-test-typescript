import * as text from "../../../../kit/text.js";

/** Where a invite tier is in its life cycle. */
export type InviteTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A invite tier. Its code is unique within a tenant. */
export class InviteTier {
  code: string;
  title: string;
  cohort: string;
  budget: number;
  externalRef: string;
  unit: string;
  clicks: number;
  status: InviteTierStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    budget: number,
    externalRef: string,
    unit: string,
    clicks: number,
    status: InviteTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.budget = budget;
    this.externalRef = externalRef;
    this.unit = unit;
    this.clicks = clicks;
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

  canMoveTo(next: InviteTierStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.budget - this.clicks) * 100) / 100;
  }

  copy(): InviteTier {
    return new InviteTier(
      this.code,
      this.title,
      this.cohort,
      this.budget,
      this.externalRef,
      this.unit,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a invite tier in status open. */
export function newInviteTier(code: string, title: string): InviteTier {
  return new InviteTier(code, title, "", 0, "", "", 0, "open");
}
