/**
 * The strict reputation exception records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict reputation exception is in its life cycle. */
export type StrictReputationExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a strict reputation exception and its current status. */
export class StrictReputationException {
  code: string;
  name: string;
  contactEmail: string;
  phone: string;
  title: string;
  endsAt: number;
  status: StrictReputationExceptionStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    phone: string,
    title: string,
    endsAt: number,
    status: StrictReputationExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.title = title;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictReputationExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictReputationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict reputation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): StrictReputationException {
    return new StrictReputationException(
      this.code,
      this.name,
      this.contactEmail,
      this.phone,
      this.title,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict reputation exception in status requested. */
export function newStrictReputationException(code: string, name: string): StrictReputationException {
  return new StrictReputationException(code, name, "", "", "", 0, "requested");
}
