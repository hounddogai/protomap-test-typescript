import * as text from "../../../../kit/text.js";

/** Where a manual badge adjustment is in its life cycle. */
export type ManualBadgeAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual badge adjustment. Its code is unique within a tenant. */
export class ManualBadgeAdjustment {
  code: string;
  label: string;
  archived: boolean;
  batchSize: number;
  title: string;
  threshold: number;
  cohort: string;
  sendAt: number;
  audienceId: string;
  channel: string;
  budget: number;
  status: ManualBadgeAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    batchSize: number,
    title: string,
    threshold: number,
    cohort: string,
    sendAt: number,
    audienceId: string,
    channel: string,
    budget: number,
    status: ManualBadgeAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.batchSize = batchSize;
    this.title = title;
    this.threshold = threshold;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.channel = channel;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualBadgeAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualBadgeAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual badge adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedTotal(): number {
    return Math.round(this.batchSize * this.threshold * 100) / 100;
  }

  copy(): ManualBadgeAdjustment {
    return new ManualBadgeAdjustment(
      this.code,
      this.label,
      this.archived,
      this.batchSize,
      this.title,
      this.threshold,
      this.cohort,
      this.sendAt,
      this.audienceId,
      this.channel,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual badge adjustment in status planned. */
export function newManualBadgeAdjustment(code: string, label: string): ManualBadgeAdjustment {
  return new ManualBadgeAdjustment(code, label, false, 0, "", 0, "", 0, "", "", 0, "planned");
}
