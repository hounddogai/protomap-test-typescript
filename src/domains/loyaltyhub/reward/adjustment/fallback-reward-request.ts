import * as text from "../../../../kit/text.js";

/** Where a fallback reward request is in its life cycle. */
export type FallbackRewardRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a fallback reward request and its current status. */
export class FallbackRewardRequest {
  code: string;
  label: string;
  threshold: number;
  category: string;
  audienceId: string;
  endsAt: number;
  updatedAt: number;
  cohort: string;
  tags: string[];
  frequencyCap: number;
  startsAt: number;
  status: FallbackRewardRequestStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    category: string,
    audienceId: string,
    endsAt: number,
    updatedAt: number,
    cohort: string,
    tags: string[],
    frequencyCap: number,
    startsAt: number,
    status: FallbackRewardRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.category = category;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
    this.updatedAt = updatedAt;
    this.cohort = cohort;
    this.tags = tags;
    this.frequencyCap = frequencyCap;
    this.startsAt = startsAt;
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

  canMoveTo(next: FallbackRewardRequestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackRewardRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.threshold - this.frequencyCap) * 100) / 100;
  }

  copy(): FallbackRewardRequest {
    return new FallbackRewardRequest(
      this.code,
      this.label,
      this.threshold,
      this.category,
      this.audienceId,
      this.endsAt,
      this.updatedAt,
      this.cohort,
      this.tags,
      this.frequencyCap,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback reward request in status open. */
export function newFallbackRewardRequest(code: string, label: string): FallbackRewardRequest {
  return new FallbackRewardRequest(code, label, 0, "", "", 0, 0, "", [], 0, 0, "open");
}
