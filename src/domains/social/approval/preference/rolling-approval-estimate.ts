import * as text from "../../../../kit/text.js";

/** Where a rolling approval estimate is in its life cycle. */
export type RollingApprovalEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a rolling approval estimate and its current status. */
export class RollingApprovalEstimate {
  code: string;
  name: string;
  createdAt: number;
  journeyId: string;
  limit: number;
  description: string;
  locale: string;
  tags: string[];
  status: RollingApprovalEstimateStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    journeyId: string,
    limit: number,
    description: string,
    locale: string,
    tags: string[],
    status: RollingApprovalEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.journeyId = journeyId;
    this.limit = limit;
    this.description = description;
    this.locale = locale;
    this.tags = tags;
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

  canMoveTo(next: RollingApprovalEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingApprovalEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling approval estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling approval estimate"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.createdAt + this.limit) * 100) / 100;
  }

  copy(): RollingApprovalEstimate {
    return new RollingApprovalEstimate(
      this.code,
      this.name,
      this.createdAt,
      this.journeyId,
      this.limit,
      this.description,
      this.locale,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling approval estimate in status open. */
export function newRollingApprovalEstimate(code: string, name: string): RollingApprovalEstimate {
  return new RollingApprovalEstimate(code, name, 0, "", 0, "", "", [], "open");
}
