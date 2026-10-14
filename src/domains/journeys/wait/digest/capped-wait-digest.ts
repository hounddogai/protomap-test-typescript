/**
 * The capped wait digest records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped wait digest is in its life cycle. */
export type CappedWaitDigestStatus = "created" | "validated" | "published" | "retired";

/** A capped wait digest. Its code is unique within a tenant. */
export class CappedWaitDigest {
  code: string;
  title: string;
  variant: string;
  contactEmail: string;
  limit: number;
  attempts: number;
  status: CappedWaitDigestStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    contactEmail: string,
    limit: number,
    attempts: number,
    status: CappedWaitDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedWaitDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: CappedWaitDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped wait digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped wait digest"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.attempts - this.limit) * 100) / 100;
  }

  copy(): CappedWaitDigest {
    return new CappedWaitDigest(
      this.code,
      this.title,
      this.variant,
      this.contactEmail,
      this.limit,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped wait digest in status created. */
export function newCappedWaitDigest(code: string, title: string): CappedWaitDigest {
  return new CappedWaitDigest(code, title, "", "", 0, 0, "created");
}
