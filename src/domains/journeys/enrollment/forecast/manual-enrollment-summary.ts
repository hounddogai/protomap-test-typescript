import * as text from "../../../../kit/text.js";

/** Where a manual enrollment summary is in its life cycle. */
export type ManualEnrollmentSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual enrollment summary. Its code is unique within a tenant. */
export class ManualEnrollmentSummary {
  code: string;
  name: string;
  label: string;
  bid: number;
  durationMinutes: number;
  threshold: number;
  weight: number;
  openRate: number;
  segment: string;
  region: string;
  utmSource: string;
  status: ManualEnrollmentSummaryStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    bid: number,
    durationMinutes: number,
    threshold: number,
    weight: number,
    openRate: number,
    segment: string,
    region: string,
    utmSource: string,
    status: ManualEnrollmentSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.bid = bid;
    this.durationMinutes = durationMinutes;
    this.threshold = threshold;
    this.weight = weight;
    this.openRate = openRate;
    this.segment = segment;
    this.region = region;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualEnrollmentSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualEnrollmentSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual enrollment summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.threshold * 100) / 100;
  }

  copy(): ManualEnrollmentSummary {
    return new ManualEnrollmentSummary(
      this.code,
      this.name,
      this.label,
      this.bid,
      this.durationMinutes,
      this.threshold,
      this.weight,
      this.openRate,
      this.segment,
      this.region,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual enrollment summary in status new. */
export function newManualEnrollmentSummary(code: string, name: string): ManualEnrollmentSummary {
  return new ManualEnrollmentSummary(code, name, "", 0, 0, 0, 0, 0, "", "", "", "new");
}
