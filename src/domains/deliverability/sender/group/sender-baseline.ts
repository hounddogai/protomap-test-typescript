import * as text from "../../../../kit/text.js";

/** Where a sender baseline is in its life cycle. */
export type SenderBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A sender baseline as the sender team keeps it. */
export class SenderBaseline {
  code: string;
  title: string;
  archived: boolean;
  country: string;
  version: number;
  campaignRef: string;
  revision: number;
  budget: number;
  ceiling: number;
  pinned: boolean;
  visible: boolean;
  status: SenderBaselineStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    country: string,
    version: number,
    campaignRef: string,
    revision: number,
    budget: number,
    ceiling: number,
    pinned: boolean,
    visible: boolean,
    status: SenderBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.country = country;
    this.version = version;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.budget = budget;
    this.ceiling = ceiling;
    this.pinned = pinned;
    this.visible = visible;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.ceiling + this.version) * 100) / 100;
  }

  copy(): SenderBaseline {
    return new SenderBaseline(
      this.code,
      this.title,
      this.archived,
      this.country,
      this.version,
      this.campaignRef,
      this.revision,
      this.budget,
      this.ceiling,
      this.pinned,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a sender baseline in status proposed. */
export function newSenderBaseline(code: string, title: string): SenderBaseline {
  return new SenderBaseline(code, title, false, "", 0, "", 0, 0, 0, false, false, "proposed");
}
