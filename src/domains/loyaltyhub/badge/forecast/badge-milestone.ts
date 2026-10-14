import * as text from "../../../../kit/text.js";

/** Where a badge milestone is in its life cycle. */
export type BadgeMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** One badge milestone, with what the planners need to act on it. */
export class BadgeMilestone {
  code: string;
  name: string;
  region: string;
  minimum: number;
  limit: number;
  category: string;
  locale: string;
  revision: number;
  phone: string;
  status: BadgeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    minimum: number,
    limit: number,
    category: string,
    locale: string,
    revision: number,
    phone: string,
    status: BadgeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.minimum = minimum;
    this.limit = limit;
    this.category = category;
    this.locale = locale;
    this.revision = revision;
    this.phone = phone;
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

  canMoveTo(next: BadgeMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedLoad(): number {
    return Math.round((this.revision - this.minimum) * 100) / 100;
  }

  copy(): BadgeMilestone {
    return new BadgeMilestone(
      this.code,
      this.name,
      this.region,
      this.minimum,
      this.limit,
      this.category,
      this.locale,
      this.revision,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a badge milestone in status new. */
export function newBadgeMilestone(code: string, name: string): BadgeMilestone {
  return new BadgeMilestone(code, name, "", 0, 0, "", "", 0, "", "new");
}
