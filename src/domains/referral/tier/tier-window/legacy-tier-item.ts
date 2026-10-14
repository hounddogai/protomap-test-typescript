import * as text from "../../../../kit/text.js";

/** Where a legacy tier item is in its life cycle. */
export type LegacyTierItemStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy tier item and its current status. */
export class LegacyTierItem {
  code: string;
  title: string;
  locale: string;
  version: number;
  currency: string;
  durationMinutes: number;
  priority: number;
  status: LegacyTierItemStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    version: number,
    currency: string,
    durationMinutes: number,
    priority: number,
    status: LegacyTierItemStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.version = version;
    this.currency = currency;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
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

  canMoveTo(next: LegacyTierItemStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyTierItemStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy tier item ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveLoad(): number {
    return Math.round((this.priority - this.version) * 100) / 100;
  }

  copy(): LegacyTierItem {
    return new LegacyTierItem(
      this.code,
      this.title,
      this.locale,
      this.version,
      this.currency,
      this.durationMinutes,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy tier item in status requested. */
export function newLegacyTierItem(code: string, title: string): LegacyTierItem {
  return new LegacyTierItem(code, title, "", 0, "", 0, 0, "requested");
}
