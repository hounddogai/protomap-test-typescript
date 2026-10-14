import * as text from "../../../../kit/text.js";

/** Where a scheduled domain group is in its life cycle. */
export type ScheduledDomainGroupStatus = "created" | "validated" | "published" | "retired";

/** A scheduled domain group as the domain team keeps it. */
export class ScheduledDomainGroup {
  code: string;
  name: string;
  discount: number;
  description: string;
  summary: string;
  active: boolean;
  updatedAt: number;
  status: ScheduledDomainGroupStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    description: string,
    summary: string,
    active: boolean,
    updatedAt: number,
    status: ScheduledDomainGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.description = description;
    this.summary = summary;
    this.active = active;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledDomainGroupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledDomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled domain group"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.discount * this.updatedAt * 100) / 100;
  }

  copy(): ScheduledDomainGroup {
    return new ScheduledDomainGroup(
      this.code,
      this.name,
      this.discount,
      this.description,
      this.summary,
      this.active,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled domain group in status created. */
export function newScheduledDomainGroup(code: string, name: string): ScheduledDomainGroup {
  return new ScheduledDomainGroup(code, name, 0, "", "", false, 0, "created");
}
