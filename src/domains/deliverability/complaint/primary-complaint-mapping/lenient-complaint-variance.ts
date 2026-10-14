import * as text from "../../../../kit/text.js";

/** Where a lenient complaint variance is in its life cycle. */
export type LenientComplaintVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient complaint variance. Its code is unique within a tenant. */
export class LenientComplaintVariance {
  code: string;
  title: string;
  windowDays: number;
  updatedAt: number;
  endsAt: number;
  budget: number;
  tags: string[];
  reviewer: string;
  visible: boolean;
  journeyId: string;
  summary: string;
  status: LenientComplaintVarianceStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    updatedAt: number,
    endsAt: number,
    budget: number,
    tags: string[],
    reviewer: string,
    visible: boolean,
    journeyId: string,
    summary: string,
    status: LenientComplaintVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.updatedAt = updatedAt;
    this.endsAt = endsAt;
    this.budget = budget;
    this.tags = tags;
    this.reviewer = reviewer;
    this.visible = visible;
    this.journeyId = journeyId;
    this.summary = summary;
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

  canMoveTo(next: LenientComplaintVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientComplaintVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient complaint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.updatedAt + this.windowDays) * 100) / 100;
  }

  copy(): LenientComplaintVariance {
    return new LenientComplaintVariance(
      this.code,
      this.title,
      this.windowDays,
      this.updatedAt,
      this.endsAt,
      this.budget,
      this.tags,
      this.reviewer,
      this.visible,
      this.journeyId,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient complaint variance in status requested. */
export function newLenientComplaintVariance(code: string, title: string): LenientComplaintVariance {
  return new LenientComplaintVariance(code, title, 0, 0, 0, 0, [], "", false, "", "", "requested");
}
