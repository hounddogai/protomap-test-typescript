import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view draft is in its life cycle. */
export type LegacyTicketViewDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A legacy ticket view draft. Its code is unique within a tenant. */
export class LegacyTicketViewDraft {
  code: string;
  title: string;
  phone: string;
  source: string;
  label: string;
  expiresAt: number;
  sendAt: number;
  description: string;
  externalRef: string;
  contactEmail: string;
  status: LegacyTicketViewDraftStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    source: string,
    label: string,
    expiresAt: number,
    sendAt: number,
    description: string,
    externalRef: string,
    contactEmail: string,
    status: LegacyTicketViewDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.source = source;
    this.label = label;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.description = description;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTicketViewDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LegacyTicketViewDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy ticket view draft"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.sendAt * this.expiresAt * 100) / 100;
  }

  copy(): LegacyTicketViewDraft {
    return new LegacyTicketViewDraft(
      this.code,
      this.title,
      this.phone,
      this.source,
      this.label,
      this.expiresAt,
      this.sendAt,
      this.description,
      this.externalRef,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a legacy ticket view draft in status draft. */
export function newLegacyTicketViewDraft(code: string, title: string): LegacyTicketViewDraft {
  return new LegacyTicketViewDraft(code, title, "", "", "", 0, 0, "", "", "", "draft");
}
