import * as text from "../../../../kit/text.js";

/** Where a cohort claim is in its life cycle. */
export type CohortClaimStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A cohort claim. Its code is unique within a tenant. */
export class CohortClaim {
  code: string;
  title: string;
  sendAt: number;
  variant: string;
  updatedAt: number;
  status: CohortClaimStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    variant: string,
    updatedAt: number,
    status: CohortClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.variant = variant;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: CohortClaimStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CohortClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.updatedAt - this.sendAt) * 100) / 100;
  }

  copy(): CohortClaim {
    return new CohortClaim(this.code, this.title, this.sendAt, this.variant, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a cohort claim in status draft. */
export function newCohortClaim(code: string, title: string): CohortClaim {
  return new CohortClaim(code, title, 0, "", 0, "draft");
}
