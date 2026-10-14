import * as text from "../../../../kit/text.js";

/** Where a default reply digest is in its life cycle. */
export type DefaultReplyDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a default reply digest and its current status. */
export class DefaultReplyDigest {
  code: string;
  label: string;
  category: string;
  durationMinutes: number;
  expiresAt: number;
  contactEmail: string;
  ownerId: string;
  sequence: number;
  status: DefaultReplyDigestStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    durationMinutes: number,
    expiresAt: number,
    contactEmail: string,
    ownerId: string,
    sequence: number,
    status: DefaultReplyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.contactEmail = contactEmail;
    this.ownerId = ownerId;
    this.sequence = sequence;
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

  canMoveTo(next: DefaultReplyDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultReplyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reply digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedValue(): number {
    return Math.round((this.durationMinutes + this.sequence) * 100) / 100;
  }

  copy(): DefaultReplyDigest {
    return new DefaultReplyDigest(
      this.code,
      this.label,
      this.category,
      this.durationMinutes,
      this.expiresAt,
      this.contactEmail,
      this.ownerId,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a default reply digest in status new. */
export function newDefaultReplyDigest(code: string, label: string): DefaultReplyDigest {
  return new DefaultReplyDigest(code, label, "", 0, 0, "", "", 0, "new");
}
