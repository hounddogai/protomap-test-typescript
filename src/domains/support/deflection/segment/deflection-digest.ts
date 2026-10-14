import * as text from "../../../../kit/text.js";

/** Where a deflection digest is in its life cycle. */
export type DeflectionDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A deflection digest. Its code is unique within a tenant. */
export class DeflectionDigest {
  code: string;
  title: string;
  quantity: number;
  utmSource: string;
  retries: number;
  ownerId: string;
  country: string;
  budget: number;
  startsAt: number;
  status: DeflectionDigestStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    utmSource: string,
    retries: number,
    ownerId: string,
    country: string,
    budget: number,
    startsAt: number,
    status: DeflectionDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.retries = retries;
    this.ownerId = ownerId;
    this.country = country;
    this.budget = budget;
    this.startsAt = startsAt;
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

  canMoveTo(next: DeflectionDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DeflectionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.quantity + this.startsAt) * 100) / 100;
  }

  copy(): DeflectionDigest {
    return new DeflectionDigest(
      this.code,
      this.title,
      this.quantity,
      this.utmSource,
      this.retries,
      this.ownerId,
      this.country,
      this.budget,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection digest in status new. */
export function newDeflectionDigest(code: string, title: string): DeflectionDigest {
  return new DeflectionDigest(code, title, 0, "", 0, "", "", 0, 0, "new");
}
