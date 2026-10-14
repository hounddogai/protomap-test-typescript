/**
 * The invite draft records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite draft is in its life cycle. */
export type InviteDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a invite draft and its current status. */
export class InviteDraft {
  code: string;
  name: string;
  title: string;
  impressions: number;
  channel: string;
  status: InviteDraftStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    impressions: number,
    channel: string,
    status: InviteDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.impressions = impressions;
    this.channel = channel;
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

  canMoveTo(next: InviteDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: InviteDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): InviteDraft {
    return new InviteDraft(this.code, this.name, this.title, this.impressions, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a invite draft in status open. */
export function newInviteDraft(code: string, name: string): InviteDraft {
  return new InviteDraft(code, name, "", 0, "", "open");
}
