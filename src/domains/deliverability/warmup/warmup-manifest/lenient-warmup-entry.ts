import * as text from "../../../../kit/text.js";

/** Where a lenient warmup entry is in its life cycle. */
export type LenientWarmupEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A lenient warmup entry as the warmup team keeps it. */
export class LenientWarmupEntry {
  code: string;
  title: string;
  floorValue: number;
  updatedAt: number;
  attributes: Map<string, string>;
  visible: boolean;
  currency: string;
  status: LenientWarmupEntryStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    updatedAt: number,
    attributes: Map<string, string>,
    visible: boolean,
    currency: string,
    status: LenientWarmupEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.visible = visible;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientWarmupEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LenientWarmupEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient warmup entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round(this.updatedAt * this.floorValue * 100) / 100;
  }

  copy(): LenientWarmupEntry {
    return new LenientWarmupEntry(
      this.code,
      this.title,
      this.floorValue,
      this.updatedAt,
      this.attributes,
      this.visible,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient warmup entry in status open. */
export function newLenientWarmupEntry(code: string, title: string): LenientWarmupEntry {
  return new LenientWarmupEntry(code, title, 0, 0, new Map<string, string>(), false, "", "open");
}
