import * as text from "../../../../kit/text.js";

/** Where a tiered journey digest is in its life cycle. */
export type TieredJourneyDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered journey digest as the journey team keeps it. */
export class TieredJourneyDigest {
  code: string;
  label: string;
  frequencyCap: number;
  tags: string[];
  source: string;
  createdAt: number;
  campaignRef: string;
  journeyId: string;
  contactEmail: string;
  capacity: number;
  status: TieredJourneyDigestStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    tags: string[],
    source: string,
    createdAt: number,
    campaignRef: string,
    journeyId: string,
    contactEmail: string,
    capacity: number,
    status: TieredJourneyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.source = source;
    this.createdAt = createdAt;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
    this.capacity = capacity;
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

  canMoveTo(next: TieredJourneyDigestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredJourneyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered journey digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.createdAt + this.frequencyCap) * 100) / 100;
  }

  copy(): TieredJourneyDigest {
    return new TieredJourneyDigest(
      this.code,
      this.label,
      this.frequencyCap,
      this.tags,
      this.source,
      this.createdAt,
      this.campaignRef,
      this.journeyId,
      this.contactEmail,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered journey digest in status open. */
export function newTieredJourneyDigest(code: string, label: string): TieredJourneyDigest {
  return new TieredJourneyDigest(code, label, 0, [], "", 0, "", "", "", 0, "open");
}
