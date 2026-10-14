import * as text from "../../../../kit/text.js";

/** Where a batched cohort bundle is in its life cycle. */
export type BatchedCohortBundleStatus = "created" | "validated" | "published" | "retired";

/** A batched cohort bundle as the cohort team keeps it. */
export class BatchedCohortBundle {
  code: string;
  label: string;
  discount: number;
  visible: boolean;
  contactEmail: string;
  region: string;
  externalRef: string;
  journeyId: string;
  frequencyCap: number;
  status: BatchedCohortBundleStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    visible: boolean,
    contactEmail: string,
    region: string,
    externalRef: string,
    journeyId: string,
    frequencyCap: number,
    status: BatchedCohortBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.region = region;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: BatchedCohortBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedCohortBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched cohort bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.discount - this.frequencyCap) * 100) / 100;
  }

  copy(): BatchedCohortBundle {
    return new BatchedCohortBundle(
      this.code,
      this.label,
      this.discount,
      this.visible,
      this.contactEmail,
      this.region,
      this.externalRef,
      this.journeyId,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched cohort bundle in status created. */
export function newBatchedCohortBundle(code: string, label: string): BatchedCohortBundle {
  return new BatchedCohortBundle(code, label, 0, false, "", "", "", "", 0, "created");
}
