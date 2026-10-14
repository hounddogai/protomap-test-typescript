import * as text from "../../../../kit/text.js";

/** Where a default invite score is in its life cycle. */
export type DefaultInviteScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default invite score and its current status. */
export class DefaultInviteScore {
  code: string;
  title: string;
  active: boolean;
  discount: number;
  checksum: string;
  archived: boolean;
  attempts: number;
  capacity: number;
  frequencyCap: number;
  impressions: number;
  contactEmail: string;
  status: DefaultInviteScoreStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    discount: number,
    checksum: string,
    archived: boolean,
    attempts: number,
    capacity: number,
    frequencyCap: number,
    impressions: number,
    contactEmail: string,
    status: DefaultInviteScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.discount = discount;
    this.checksum = checksum;
    this.archived = archived;
    this.attempts = attempts;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
    this.impressions = impressions;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: DefaultInviteScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultInviteScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default invite score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"default invite score"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.attempts - this.capacity) * 100) / 100;
  }

  copy(): DefaultInviteScore {
    return new DefaultInviteScore(
      this.code,
      this.title,
      this.active,
      this.discount,
      this.checksum,
      this.archived,
      this.attempts,
      this.capacity,
      this.frequencyCap,
      this.impressions,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default invite score in status proposed. */
export function newDefaultInviteScore(code: string, title: string): DefaultInviteScore {
  return new DefaultInviteScore(code, title, false, 0, "", false, 0, 0, 0, 0, "", "proposed");
}
