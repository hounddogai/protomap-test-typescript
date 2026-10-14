import * as text from "../../../../kit/text.js";

/** Where a capped creative bundle is in its life cycle. */
export type CappedCreativeBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped creative bundle as the creative team keeps it. */
export class CappedCreativeBundle {
  code: string;
  label: string;
  priority: number;
  utmSource: string;
  currency: string;
  contactEmail: string;
  unit: string;
  tags: string[];
  retries: number;
  status: CappedCreativeBundleStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    utmSource: string,
    currency: string,
    contactEmail: string,
    unit: string,
    tags: string[],
    retries: number,
    status: CappedCreativeBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.utmSource = utmSource;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.unit = unit;
    this.tags = tags;
    this.retries = retries;
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

  canMoveTo(next: CappedCreativeBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedCreativeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped creative bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round((this.priority - this.retries) * 100) / 100;
  }

  copy(): CappedCreativeBundle {
    return new CappedCreativeBundle(
      this.code,
      this.label,
      this.priority,
      this.utmSource,
      this.currency,
      this.contactEmail,
      this.unit,
      this.tags,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped creative bundle in status open. */
export function newCappedCreativeBundle(code: string, label: string): CappedCreativeBundle {
  return new CappedCreativeBundle(code, label, 0, "", "", "", "", [], 0, "open");
}
