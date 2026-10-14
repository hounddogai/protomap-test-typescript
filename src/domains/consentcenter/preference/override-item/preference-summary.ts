import * as text from "../../../../kit/text.js";

/** Where a preference summary is in its life cycle. */
export type PreferenceSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A preference summary. Its code is unique within a tenant. */
export class PreferenceSummary {
  code: string;
  name: string;
  archived: boolean;
  ownerId: string;
  checksum: string;
  quantity: number;
  status: PreferenceSummaryStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    ownerId: string,
    checksum: string,
    quantity: number,
    status: PreferenceSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.quantity = quantity;
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

  canMoveTo(next: PreferenceSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
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

  moveTo(next: PreferenceSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): PreferenceSummary {
    return new PreferenceSummary(
      this.code,
      this.name,
      this.archived,
      this.ownerId,
      this.checksum,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference summary in status open. */
export function newPreferenceSummary(code: string, name: string): PreferenceSummary {
  return new PreferenceSummary(code, name, false, "", "", 0, "open");
}
