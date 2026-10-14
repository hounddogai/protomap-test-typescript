import * as text from "../../../../kit/text.js";

/** Where a reply digest is in its life cycle. */
export type ReplyDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One reply digest, with what the planners need to act on it. */
export class ReplyDigest {
  code: string;
  label: string;
  locale: string;
  summary: string;
  createdAt: number;
  status: ReplyDigestStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    summary: string,
    createdAt: number,
    status: ReplyDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.summary = summary;
    this.createdAt = createdAt;
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

  canMoveTo(next: ReplyDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
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

  moveTo(next: ReplyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ReplyDigest {
    return new ReplyDigest(this.code, this.label, this.locale, this.summary, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reply digest in status proposed. */
export function newReplyDigest(code: string, label: string): ReplyDigest {
  return new ReplyDigest(code, label, "", "", 0, "proposed");
}
