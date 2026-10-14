import * as text from "../../../../kit/text.js";

/** Where a default invite request is in its life cycle. */
export type DefaultInviteRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a default invite request and its current status. */
export class DefaultInviteRequest {
  code: string;
  title: string;
  quantity: number;
  locale: string;
  category: string;
  status: DefaultInviteRequestStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    locale: string,
    category: string,
    status: DefaultInviteRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.locale = locale;
    this.category = category;
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

  canMoveTo(next: DefaultInviteRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultInviteRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default invite request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DefaultInviteRequest {
    return new DefaultInviteRequest(this.code, this.title, this.quantity, this.locale, this.category, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default invite request in status proposed. */
export function newDefaultInviteRequest(code: string, title: string): DefaultInviteRequest {
  return new DefaultInviteRequest(code, title, 0, "", "", "proposed");
}
