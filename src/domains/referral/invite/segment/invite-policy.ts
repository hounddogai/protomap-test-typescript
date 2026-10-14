import * as text from "../../../../kit/text.js";

/** Where a invite policy is in its life cycle. */
export type InvitePolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One invite policy, with what the planners need to act on it. */
export class InvitePolicy {
  code: string;
  title: string;
  endsAt: number;
  openRate: number;
  locale: string;
  approved: boolean;
  visible: boolean;
  name: string;
  journeyId: string;
  expiresAt: number;
  notes: string;
  status: InvitePolicyStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    openRate: number,
    locale: string,
    approved: boolean,
    visible: boolean,
    name: string,
    journeyId: string,
    expiresAt: number,
    notes: string,
    status: InvitePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.openRate = openRate;
    this.locale = locale;
    this.approved = approved;
    this.visible = visible;
    this.name = name;
    this.journeyId = journeyId;
    this.expiresAt = expiresAt;
    this.notes = notes;
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

  canMoveTo(next: InvitePolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: InvitePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.endsAt + this.expiresAt) * 100) / 100;
  }

  copy(): InvitePolicy {
    return new InvitePolicy(
      this.code,
      this.title,
      this.endsAt,
      this.openRate,
      this.locale,
      this.approved,
      this.visible,
      this.name,
      this.journeyId,
      this.expiresAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a invite policy in status open. */
export function newInvitePolicy(code: string, title: string): InvitePolicy {
  return new InvitePolicy(code, title, 0, 0, "", false, false, "", "", 0, "", "open");
}
