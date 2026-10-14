import * as text from "../../../../kit/text.js";

/** Where a domain exception is in its life cycle. */
export type DomainExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a domain exception and its current status. */
export class DomainException {
  code: string;
  title: string;
  tags: string[];
  externalRef: string;
  retries: number;
  discount: number;
  budget: number;
  graceDays: number;
  attempts: number;
  floorValue: number;
  status: DomainExceptionStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    externalRef: string,
    retries: number,
    discount: number,
    budget: number,
    graceDays: number,
    attempts: number,
    floorValue: number,
    status: DomainExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.externalRef = externalRef;
    this.retries = retries;
    this.discount = discount;
    this.budget = budget;
    this.graceDays = graceDays;
    this.attempts = attempts;
    this.floorValue = floorValue;
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

  canMoveTo(next: DomainExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"domain exception"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedExposure(): number {
    return Math.round((this.attempts + this.budget) * 100) / 100;
  }

  copy(): DomainException {
    return new DomainException(
      this.code,
      this.title,
      this.tags,
      this.externalRef,
      this.retries,
      this.discount,
      this.budget,
      this.graceDays,
      this.attempts,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a domain exception in status requested. */
export function newDomainException(code: string, title: string): DomainException {
  return new DomainException(code, title, [], "", 0, 0, 0, 0, 0, 0, "requested");
}
