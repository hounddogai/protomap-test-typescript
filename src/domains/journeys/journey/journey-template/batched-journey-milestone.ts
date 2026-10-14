import * as text from "../../../../kit/text.js";

/** Where a batched journey milestone is in its life cycle. */
export type BatchedJourneyMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One batched journey milestone, with what the planners need to act on it. */
export class BatchedJourneyMilestone {
  code: string;
  label: string;
  checksum: string;
  description: string;
  floorValue: number;
  sendAt: number;
  contactEmail: string;
  campaignRef: string;
  expiresAt: number;
  sequence: number;
  locale: string;
  status: BatchedJourneyMilestoneStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    description: string,
    floorValue: number,
    sendAt: number,
    contactEmail: string,
    campaignRef: string,
    expiresAt: number,
    sequence: number,
    locale: string,
    status: BatchedJourneyMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.description = description;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.sequence = sequence;
    this.locale = locale;
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

  canMoveTo(next: BatchedJourneyMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "archived":
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

  moveTo(next: BatchedJourneyMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched journey milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"batched journey milestone"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.floorValue * this.expiresAt * 100) / 100;
  }

  copy(): BatchedJourneyMilestone {
    return new BatchedJourneyMilestone(
      this.code,
      this.label,
      this.checksum,
      this.description,
      this.floorValue,
      this.sendAt,
      this.contactEmail,
      this.campaignRef,
      this.expiresAt,
      this.sequence,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a batched journey milestone in status open. */
export function newBatchedJourneyMilestone(code: string, label: string): BatchedJourneyMilestone {
  return new BatchedJourneyMilestone(code, label, "", "", 0, 0, "", "", 0, 0, "", "open");
}
