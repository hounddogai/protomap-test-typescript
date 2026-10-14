import * as text from "../../../../kit/text.js";

/** Where a primary nudge variance is in its life cycle. */
export type PrimaryNudgeVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary nudge variance. Its code is unique within a tenant. */
export class PrimaryNudgeVariance {
  code: string;
  title: string;
  minimum: number;
  contactEmail: string;
  revision: number;
  expiresAt: number;
  cost: number;
  status: PrimaryNudgeVarianceStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    contactEmail: string,
    revision: number,
    expiresAt: number,
    cost: number,
    status: PrimaryNudgeVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.expiresAt = expiresAt;
    this.cost = cost;
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

  canMoveTo(next: PrimaryNudgeVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryNudgeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary nudge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveExposure(): number {
    return Math.round((this.revision - this.expiresAt) * 100) / 100;
  }

  copy(): PrimaryNudgeVariance {
    return new PrimaryNudgeVariance(
      this.code,
      this.title,
      this.minimum,
      this.contactEmail,
      this.revision,
      this.expiresAt,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary nudge variance in status proposed. */
export function newPrimaryNudgeVariance(code: string, title: string): PrimaryNudgeVariance {
  return new PrimaryNudgeVariance(code, title, 0, "", 0, 0, 0, "proposed");
}
