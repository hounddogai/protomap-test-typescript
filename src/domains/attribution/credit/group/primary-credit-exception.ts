import * as text from "../../../../kit/text.js";

/** Where a primary credit exception is in its life cycle. */
export type PrimaryCreditExceptionStatus = "created" | "validated" | "published" | "retired";

/** A primary credit exception. Its code is unique within a tenant. */
export class PrimaryCreditException {
  code: string;
  title: string;
  ratio: number;
  source: string;
  impressions: number;
  endsAt: number;
  ceiling: number;
  discount: number;
  category: string;
  status: PrimaryCreditExceptionStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    source: string,
    impressions: number,
    endsAt: number,
    ceiling: number,
    discount: number,
    category: string,
    status: PrimaryCreditExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.source = source;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.ceiling = ceiling;
    this.discount = discount;
    this.category = category;
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

  canMoveTo(next: PrimaryCreditExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryCreditExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary credit exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.endsAt + this.ratio) * 100) / 100;
  }

  copy(): PrimaryCreditException {
    return new PrimaryCreditException(
      this.code,
      this.title,
      this.ratio,
      this.source,
      this.impressions,
      this.endsAt,
      this.ceiling,
      this.discount,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary credit exception in status created. */
export function newPrimaryCreditException(code: string, title: string): PrimaryCreditException {
  return new PrimaryCreditException(code, title, 0, "", 0, 0, 0, 0, "", "created");
}
