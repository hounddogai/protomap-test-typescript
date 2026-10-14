import * as text from "../../../../kit/text.js";

/** Where a opt out entry is in its life cycle. */
export type OptOutEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A opt out entry as the opt out team keeps it. */
export class OptOutEntry {
  code: string;
  name: string;
  country: string;
  updatedAt: number;
  budget: number;
  label: string;
  maximum: number;
  category: string;
  journeyId: string;
  threshold: number;
  checksum: string;
  status: OptOutEntryStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    updatedAt: number,
    budget: number,
    label: string,
    maximum: number,
    category: string,
    journeyId: string,
    threshold: number,
    checksum: string,
    status: OptOutEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.label = label;
    this.maximum = maximum;
    this.category = category;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.checksum = checksum;
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

  canMoveTo(next: OptOutEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: OptOutEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round(this.threshold * this.maximum * 100) / 100;
  }

  copy(): OptOutEntry {
    return new OptOutEntry(
      this.code,
      this.name,
      this.country,
      this.updatedAt,
      this.budget,
      this.label,
      this.maximum,
      this.category,
      this.journeyId,
      this.threshold,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a opt out entry in status open. */
export function newOptOutEntry(code: string, name: string): OptOutEntry {
  return new OptOutEntry(code, name, "", 0, 0, "", 0, "", "", 0, "", "open");
}
