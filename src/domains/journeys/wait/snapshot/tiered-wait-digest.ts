import * as text from "../../../../kit/text.js";

/** Where a tiered wait digest is in its life cycle. */
export type TieredWaitDigestStatus = "created" | "validated" | "published" | "retired";

/** One tiered wait digest, with what the planners need to act on it. */
export class TieredWaitDigest {
  code: string;
  name: string;
  priority: number;
  description: string;
  summary: string;
  country: string;
  phone: string;
  locale: string;
  discount: number;
  status: TieredWaitDigestStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    description: string,
    summary: string,
    country: string,
    phone: string,
    locale: string,
    discount: number,
    status: TieredWaitDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.description = description;
    this.summary = summary;
    this.country = country;
    this.phone = phone;
    this.locale = locale;
    this.discount = discount;
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

  canMoveTo(next: TieredWaitDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredWaitDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered wait digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round(this.discount * this.priority * 100) / 100;
  }

  copy(): TieredWaitDigest {
    return new TieredWaitDigest(
      this.code,
      this.name,
      this.priority,
      this.description,
      this.summary,
      this.country,
      this.phone,
      this.locale,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered wait digest in status created. */
export function newTieredWaitDigest(code: string, name: string): TieredWaitDigest {
  return new TieredWaitDigest(code, name, 0, "", "", "", "", "", 0, "created");
}
