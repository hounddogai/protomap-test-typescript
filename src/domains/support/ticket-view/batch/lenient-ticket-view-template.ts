import * as text from "../../../../kit/text.js";

/** Where a lenient ticket view template is in its life cycle. */
export type LenientTicketViewTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a lenient ticket view template and its current status. */
export class LenientTicketViewTemplate {
  code: string;
  title: string;
  expiresAt: number;
  reviewer: string;
  phone: string;
  currency: string;
  sendAt: number;
  status: LenientTicketViewTemplateStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    reviewer: string,
    phone: string,
    currency: string,
    sendAt: number,
    status: LenientTicketViewTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.phone = phone;
    this.currency = currency;
    this.sendAt = sendAt;
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

  canMoveTo(next: LenientTicketViewTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientTicketViewTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient ticket view template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.expiresAt + this.sendAt) * 100) / 100;
  }

  copy(): LenientTicketViewTemplate {
    return new LenientTicketViewTemplate(
      this.code,
      this.title,
      this.expiresAt,
      this.reviewer,
      this.phone,
      this.currency,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient ticket view template in status open. */
export function newLenientTicketViewTemplate(code: string, title: string): LenientTicketViewTemplate {
  return new LenientTicketViewTemplate(code, title, 0, "", "", "", 0, "open");
}
