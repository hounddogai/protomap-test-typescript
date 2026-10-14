import * as text from "../../../../kit/text.js";

/** Where a capped proof quota is in its life cycle. */
export type CappedProofQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped proof quota. Its code is unique within a tenant. */
export class CappedProofQuota {
  code: string;
  label: string;
  minimum: number;
  approved: boolean;
  source: string;
  limit: number;
  score: number;
  updatedAt: number;
  status: CappedProofQuotaStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    approved: boolean,
    source: string,
    limit: number,
    score: number,
    updatedAt: number,
    status: CappedProofQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.approved = approved;
    this.source = source;
    this.limit = limit;
    this.score = score;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: CappedProofQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedProofQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped proof quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"capped proof quota"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.updatedAt * this.limit * 100) / 100;
  }

  copy(): CappedProofQuota {
    return new CappedProofQuota(
      this.code,
      this.label,
      this.minimum,
      this.approved,
      this.source,
      this.limit,
      this.score,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped proof quota in status open. */
export function newCappedProofQuota(code: string, label: string): CappedProofQuota {
  return new CappedProofQuota(code, label, 0, false, "", 0, 0, 0, "open");
}
