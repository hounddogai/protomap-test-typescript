import * as text from "../../../../kit/text.js";

/** Where a window allocation is in its life cycle. */
export type WindowAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window allocation as the window team keeps it. */
export class WindowAllocation {
  code: string;
  name: string;
  category: string;
  maximum: number;
  channel: string;
  startsAt: number;
  utmSource: string;
  description: string;
  title: string;
  contactEmail: string;
  status: WindowAllocationStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    maximum: number,
    channel: string,
    startsAt: number,
    utmSource: string,
    description: string,
    title: string,
    contactEmail: string,
    status: WindowAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.maximum = maximum;
    this.channel = channel;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.description = description;
    this.title = title;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: WindowAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
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
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.maximum + this.startsAt) * 100) / 100;
  }

  copy(): WindowAllocation {
    return new WindowAllocation(
      this.code,
      this.name,
      this.category,
      this.maximum,
      this.channel,
      this.startsAt,
      this.utmSource,
      this.description,
      this.title,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a window allocation in status open. */
export function newWindowAllocation(code: string, name: string): WindowAllocation {
  return new WindowAllocation(code, name, "", 0, "", 0, "", "", "", "", "open");
}
