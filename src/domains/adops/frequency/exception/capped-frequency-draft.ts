import * as text from "../../../../kit/text.js";

/** Where a capped frequency draft is in its life cycle. */
export type CappedFrequencyDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped frequency draft, with what the planners need to act on it. */
export class CappedFrequencyDraft {
  code: string;
  title: string;
  contactEmail: string;
  startsAt: number;
  channel: string;
  active: boolean;
  limit: number;
  version: number;
  status: CappedFrequencyDraftStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    startsAt: number,
    channel: string,
    active: boolean,
    limit: number,
    version: number,
    status: CappedFrequencyDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.channel = channel;
    this.active = active;
    this.limit = limit;
    this.version = version;
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

  canMoveTo(next: CappedFrequencyDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedFrequencyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped frequency draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveTotal(): number {
    return Math.round(this.limit * this.version * 100) / 100;
  }

  copy(): CappedFrequencyDraft {
    return new CappedFrequencyDraft(
      this.code,
      this.title,
      this.contactEmail,
      this.startsAt,
      this.channel,
      this.active,
      this.limit,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped frequency draft in status proposed. */
export function newCappedFrequencyDraft(code: string, title: string): CappedFrequencyDraft {
  return new CappedFrequencyDraft(code, title, "", 0, "", false, 0, 0, "proposed");
}
