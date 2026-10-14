import * as text from "../../../../kit/text.js";

/** Where a window digest is in its life cycle. */
export type WindowDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A window digest. Its code is unique within a tenant. */
export class WindowDigest {
  code: string;
  name: string;
  durationMinutes: number;
  attributes: Map<string, string>;
  variant: string;
  currency: string;
  graceDays: number;
  floorValue: number;
  status: WindowDigestStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    attributes: Map<string, string>,
    variant: string,
    currency: string,
    graceDays: number,
    floorValue: number,
    status: WindowDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
    this.variant = variant;
    this.currency = currency;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.graceDays + this.durationMinutes) * 100) / 100;
  }

  copy(): WindowDigest {
    return new WindowDigest(
      this.code,
      this.name,
      this.durationMinutes,
      this.attributes,
      this.variant,
      this.currency,
      this.graceDays,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window digest in status draft. */
export function newWindowDigest(code: string, name: string): WindowDigest {
  return new WindowDigest(code, name, 0, new Map<string, string>(), "", "", 0, 0, "draft");
}
