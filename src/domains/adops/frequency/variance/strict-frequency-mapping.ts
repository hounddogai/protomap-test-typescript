import * as text from "../../../../kit/text.js";

/** Where a strict frequency mapping is in its life cycle. */
export type StrictFrequencyMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict frequency mapping, with what the planners need to act on it. */
export class StrictFrequencyMapping {
  code: string;
  title: string;
  description: string;
  bid: number;
  budget: number;
  timezone: string;
  category: string;
  sendAt: number;
  status: StrictFrequencyMappingStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    bid: number,
    budget: number,
    timezone: string,
    category: string,
    sendAt: number,
    status: StrictFrequencyMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.bid = bid;
    this.budget = budget;
    this.timezone = timezone;
    this.category = category;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictFrequencyMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictFrequencyMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict frequency mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict frequency mapping"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.sendAt - this.bid) * 100) / 100;
  }

  copy(): StrictFrequencyMapping {
    return new StrictFrequencyMapping(
      this.code,
      this.title,
      this.description,
      this.bid,
      this.budget,
      this.timezone,
      this.category,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict frequency mapping in status draft. */
export function newStrictFrequencyMapping(code: string, title: string): StrictFrequencyMapping {
  return new StrictFrequencyMapping(code, title, "", 0, 0, "", "", 0, "draft");
}
