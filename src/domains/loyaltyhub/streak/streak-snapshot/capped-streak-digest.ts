import * as text from "../../../../kit/text.js";

/** Where a capped streak digest is in its life cycle. */
export type CappedStreakDigestStatus = "created" | "validated" | "published" | "retired";

/** A capped streak digest. Its code is unique within a tenant. */
export class CappedStreakDigest {
  code: string;
  title: string;
  discount: number;
  approved: boolean;
  locale: string;
  currency: string;
  status: CappedStreakDigestStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    approved: boolean,
    locale: string,
    currency: string,
    status: CappedStreakDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.approved = approved;
    this.locale = locale;
    this.currency = currency;
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

  canMoveTo(next: CappedStreakDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedStreakDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped streak digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.discount;
  }

  copy(): CappedStreakDigest {
    return new CappedStreakDigest(
      this.code,
      this.title,
      this.discount,
      this.approved,
      this.locale,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped streak digest in status created. */
export function newCappedStreakDigest(code: string, title: string): CappedStreakDigest {
  return new CappedStreakDigest(code, title, 0, false, "", "", "created");
}
