import * as text from "../../../../kit/text.js";

/** Where a batched placement preference is in its life cycle. */
export type BatchedPlacementPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched placement preference, with what the planners need to act on it. */
export class BatchedPlacementPreference {
  code: string;
  name: string;
  segment: string;
  minimum: number;
  rate: number;
  openRate: number;
  audienceId: string;
  contactEmail: string;
  status: BatchedPlacementPreferenceStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    minimum: number,
    rate: number,
    openRate: number,
    audienceId: string,
    contactEmail: string,
    status: BatchedPlacementPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.minimum = minimum;
    this.rate = rate;
    this.openRate = openRate;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: BatchedPlacementPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BatchedPlacementPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedValue(): number {
    return Math.round(this.minimum * this.openRate * 100) / 100;
  }

  copy(): BatchedPlacementPreference {
    return new BatchedPlacementPreference(
      this.code,
      this.name,
      this.segment,
      this.minimum,
      this.rate,
      this.openRate,
      this.audienceId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a batched placement preference in status open. */
export function newBatchedPlacementPreference(code: string, name: string): BatchedPlacementPreference {
  return new BatchedPlacementPreference(code, name, "", 0, 0, 0, "", "", "open");
}
