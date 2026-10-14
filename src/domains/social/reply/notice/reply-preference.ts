import * as text from "../../../../kit/text.js";

/** Where a reply preference is in its life cycle. */
export type ReplyPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a reply preference and its current status. */
export class ReplyPreference {
  code: string;
  title: string;
  journeyId: string;
  quantity: number;
  campaignRef: string;
  locale: string;
  graceDays: number;
  contactEmail: string;
  label: string;
  priority: number;
  pinned: boolean;
  status: ReplyPreferenceStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    quantity: number,
    campaignRef: string,
    locale: string,
    graceDays: number,
    contactEmail: string,
    label: string,
    priority: number,
    pinned: boolean,
    status: ReplyPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.label = label;
    this.priority = priority;
    this.pinned = pinned;
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

  canMoveTo(next: ReplyPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ReplyPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round(this.graceDays * this.priority * 100) / 100;
  }

  copy(): ReplyPreference {
    return new ReplyPreference(
      this.code,
      this.title,
      this.journeyId,
      this.quantity,
      this.campaignRef,
      this.locale,
      this.graceDays,
      this.contactEmail,
      this.label,
      this.priority,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reply preference in status new. */
export function newReplyPreference(code: string, title: string): ReplyPreference {
  return new ReplyPreference(code, title, "", 0, "", "", 0, "", "", 0, false, "new");
}
