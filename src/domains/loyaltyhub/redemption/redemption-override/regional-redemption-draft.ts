import * as text from "../../../../kit/text.js";

/** Where a regional redemption draft is in its life cycle. */
export type RegionalRedemptionDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a regional redemption draft and its current status. */
export class RegionalRedemptionDraft {
  code: string;
  label: string;
  sequence: number;
  reviewer: string;
  tags: string[];
  sendAt: number;
  status: RegionalRedemptionDraftStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    reviewer: string,
    tags: string[],
    sendAt: number,
    status: RegionalRedemptionDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.reviewer = reviewer;
    this.tags = tags;
    this.sendAt = sendAt;
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

  canMoveTo(next: RegionalRedemptionDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalRedemptionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional redemption draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional redemption draft"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round((this.sendAt - this.sequence) * 100) / 100;
  }

  copy(): RegionalRedemptionDraft {
    return new RegionalRedemptionDraft(
      this.code,
      this.label,
      this.sequence,
      this.reviewer,
      this.tags,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional redemption draft in status planned. */
export function newRegionalRedemptionDraft(code: string, label: string): RegionalRedemptionDraft {
  return new RegionalRedemptionDraft(code, label, 0, "", [], 0, "planned");
}
