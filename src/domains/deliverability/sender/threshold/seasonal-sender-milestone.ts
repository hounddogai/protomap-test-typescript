import * as text from "../../../../kit/text.js";

/** Where a seasonal sender milestone is in its life cycle. */
export type SeasonalSenderMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A seasonal sender milestone. Its code is unique within a tenant. */
export class SeasonalSenderMilestone {
  code: string;
  label: string;
  phone: string;
  endsAt: number;
  attributes: Map<string, string>;
  reviewer: string;
  segment: string;
  limit: number;
  status: SeasonalSenderMilestoneStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    endsAt: number,
    attributes: Map<string, string>,
    reviewer: string,
    segment: string,
    limit: number,
    status: SeasonalSenderMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.segment = segment;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalSenderMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalSenderMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal sender milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"seasonal sender milestone"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.limit - this.endsAt) * 100) / 100;
  }

  copy(): SeasonalSenderMilestone {
    return new SeasonalSenderMilestone(
      this.code,
      this.label,
      this.phone,
      this.endsAt,
      this.attributes,
      this.reviewer,
      this.segment,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal sender milestone in status proposed. */
export function newSeasonalSenderMilestone(code: string, label: string): SeasonalSenderMilestone {
  return new SeasonalSenderMilestone(code, label, "", 0, new Map<string, string>(), "", "", 0, "proposed");
}
