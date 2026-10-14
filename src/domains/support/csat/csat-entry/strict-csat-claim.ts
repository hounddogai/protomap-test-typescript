import * as text from "../../../../kit/text.js";

/** Where a strict csat claim is in its life cycle. */
export type StrictCsatClaimStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A strict csat claim. Its code is unique within a tenant. */
export class StrictCsatClaim {
  code: string;
  label: string;
  visible: boolean;
  minimum: number;
  tags: string[];
  description: string;
  limit: number;
  source: string;
  budget: number;
  retries: number;
  priority: number;
  status: StrictCsatClaimStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    minimum: number,
    tags: string[],
    description: string,
    limit: number,
    source: string,
    budget: number,
    retries: number,
    priority: number,
    status: StrictCsatClaimStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.minimum = minimum;
    this.tags = tags;
    this.description = description;
    this.limit = limit;
    this.source = source;
    this.budget = budget;
    this.retries = retries;
    this.priority = priority;
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

  canMoveTo(next: StrictCsatClaimStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
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

  moveTo(next: StrictCsatClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict csat claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict csat claim"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.minimum - this.limit) * 100) / 100;
  }

  copy(): StrictCsatClaim {
    return new StrictCsatClaim(
      this.code,
      this.label,
      this.visible,
      this.minimum,
      this.tags,
      this.description,
      this.limit,
      this.source,
      this.budget,
      this.retries,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict csat claim in status open. */
export function newStrictCsatClaim(code: string, label: string): StrictCsatClaim {
  return new StrictCsatClaim(code, label, false, 0, [], "", 0, "", 0, 0, 0, "open");
}
