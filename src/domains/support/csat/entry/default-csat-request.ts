import * as text from "../../../../kit/text.js";

/** Where a default csat request is in its life cycle. */
export type DefaultCsatRequestStatus = "created" | "validated" | "published" | "retired";

/** A default csat request. Its code is unique within a tenant. */
export class DefaultCsatRequest {
  code: string;
  title: string;
  durationMinutes: number;
  rate: number;
  campaignRef: string;
  reviewer: string;
  cohort: string;
  frequencyCap: number;
  ownerId: string;
  minimum: number;
  summary: string;
  status: DefaultCsatRequestStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    rate: number,
    campaignRef: string,
    reviewer: string,
    cohort: string,
    frequencyCap: number,
    ownerId: string,
    minimum: number,
    summary: string,
    status: DefaultCsatRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.cohort = cohort;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultCsatRequestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultCsatRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default csat request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.minimum * this.rate * 100) / 100;
  }

  copy(): DefaultCsatRequest {
    return new DefaultCsatRequest(
      this.code,
      this.title,
      this.durationMinutes,
      this.rate,
      this.campaignRef,
      this.reviewer,
      this.cohort,
      this.frequencyCap,
      this.ownerId,
      this.minimum,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default csat request in status created. */
export function newDefaultCsatRequest(code: string, title: string): DefaultCsatRequest {
  return new DefaultCsatRequest(code, title, 0, 0, "", "", "", 0, "", 0, "", "created");
}
