import * as text from "../../../../kit/text.js";

/** Where a complaint threshold is in its life cycle. */
export type ComplaintThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A complaint threshold as the complaint team keeps it. */
export class ComplaintThreshold {
  code: string;
  label: string;
  tags: string[];
  description: string;
  campaignRef: string;
  margin: number;
  journeyId: string;
  status: ComplaintThresholdStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    description: string,
    campaignRef: string,
    margin: number,
    journeyId: string,
    status: ComplaintThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.description = description;
    this.campaignRef = campaignRef;
    this.margin = margin;
    this.journeyId = journeyId;
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

  canMoveTo(next: ComplaintThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
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
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ComplaintThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): ComplaintThreshold {
    return new ComplaintThreshold(
      this.code,
      this.label,
      this.tags,
      this.description,
      this.campaignRef,
      this.margin,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a complaint threshold in status new. */
export function newComplaintThreshold(code: string, label: string): ComplaintThreshold {
  return new ComplaintThreshold(code, label, [], "", "", 0, "", "new");
}
