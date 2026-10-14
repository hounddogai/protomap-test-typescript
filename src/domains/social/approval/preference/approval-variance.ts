import * as text from "../../../../kit/text.js";

/** Where a approval variance is in its life cycle. */
export type ApprovalVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A approval variance as the approval team keeps it. */
export class ApprovalVariance {
  code: string;
  title: string;
  utmSource: string;
  reviewer: string;
  minimum: number;
  endsAt: number;
  windowDays: number;
  tags: string[];
  status: ApprovalVarianceStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    reviewer: string,
    minimum: number,
    endsAt: number,
    windowDays: number,
    tags: string[],
    status: ApprovalVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.windowDays = windowDays;
    this.tags = tags;
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

  canMoveTo(next: ApprovalVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ApprovalVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.windowDays * this.endsAt * 100) / 100;
  }

  copy(): ApprovalVariance {
    return new ApprovalVariance(
      this.code,
      this.title,
      this.utmSource,
      this.reviewer,
      this.minimum,
      this.endsAt,
      this.windowDays,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a approval variance in status draft. */
export function newApprovalVariance(code: string, title: string): ApprovalVariance {
  return new ApprovalVariance(code, title, "", "", 0, 0, 0, [], "draft");
}
