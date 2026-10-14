import * as text from "../../../../kit/text.js";

/** Where a tiered insight assignment is in its life cycle. */
export type TieredInsightAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One tiered insight assignment, with what the planners need to act on it. */
export class TieredInsightAssignment {
  code: string;
  title: string;
  contactEmail: string;
  source: string;
  campaignRef: string;
  name: string;
  version: number;
  segment: string;
  status: TieredInsightAssignmentStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    source: string,
    campaignRef: string,
    name: string,
    version: number,
    segment: string,
    status: TieredInsightAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.source = source;
    this.campaignRef = campaignRef;
    this.name = name;
    this.version = version;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredInsightAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TieredInsightAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered insight assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): TieredInsightAssignment {
    return new TieredInsightAssignment(
      this.code,
      this.title,
      this.contactEmail,
      this.source,
      this.campaignRef,
      this.name,
      this.version,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered insight assignment in status idle. */
export function newTieredInsightAssignment(code: string, title: string): TieredInsightAssignment {
  return new TieredInsightAssignment(code, title, "", "", "", "", 0, "", "idle");
}
