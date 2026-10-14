import * as text from "../../../../kit/text.js";

/** Where a journey digest is in its life cycle. */
export type JourneyDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A journey digest. Its code is unique within a tenant. */
export class JourneyDigest {
  code: string;
  label: string;
  campaignRef: string;
  windowDays: number;
  score: number;
  quantity: number;
  version: number;
  revision: number;
  reviewer: string;
  status: JourneyDigestStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    windowDays: number,
    score: number,
    quantity: number,
    version: number,
    revision: number,
    reviewer: string,
    status: JourneyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.score = score;
    this.quantity = quantity;
    this.version = version;
    this.revision = revision;
    this.reviewer = reviewer;
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

  canMoveTo(next: JourneyDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: JourneyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedVolume(): number {
    return Math.round((this.windowDays - this.quantity) * 100) / 100;
  }

  copy(): JourneyDigest {
    return new JourneyDigest(
      this.code,
      this.label,
      this.campaignRef,
      this.windowDays,
      this.score,
      this.quantity,
      this.version,
      this.revision,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey digest in status open. */
export function newJourneyDigest(code: string, label: string): JourneyDigest {
  return new JourneyDigest(code, label, "", 0, 0, 0, 0, 0, "", "open");
}
