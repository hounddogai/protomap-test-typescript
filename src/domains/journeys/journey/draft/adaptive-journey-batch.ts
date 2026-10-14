import * as text from "../../../../kit/text.js";

/** Where a adaptive journey batch is in its life cycle. */
export type AdaptiveJourneyBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive journey batch and its current status. */
export class AdaptiveJourneyBatch {
  code: string;
  title: string;
  weight: number;
  revision: number;
  durationMinutes: number;
  contactEmail: string;
  description: string;
  ratio: number;
  campaignRef: string;
  status: AdaptiveJourneyBatchStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    revision: number,
    durationMinutes: number,
    contactEmail: string,
    description: string,
    ratio: number,
    campaignRef: string,
    status: AdaptiveJourneyBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.description = description;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: AdaptiveJourneyBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveJourneyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive journey batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.durationMinutes + this.ratio) * 100) / 100;
  }

  copy(): AdaptiveJourneyBatch {
    return new AdaptiveJourneyBatch(
      this.code,
      this.title,
      this.weight,
      this.revision,
      this.durationMinutes,
      this.contactEmail,
      this.description,
      this.ratio,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive journey batch in status new. */
export function newAdaptiveJourneyBatch(code: string, title: string): AdaptiveJourneyBatch {
  return new AdaptiveJourneyBatch(code, title, 0, 0, 0, "", "", 0, "", "new");
}
