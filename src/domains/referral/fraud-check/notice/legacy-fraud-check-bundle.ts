import * as text from "../../../../kit/text.js";

/** Where a legacy fraud check bundle is in its life cycle. */
export type LegacyFraudCheckBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One legacy fraud check bundle, with what the planners need to act on it. */
export class LegacyFraudCheckBundle {
  code: string;
  title: string;
  locale: string;
  cost: number;
  expiresAt: number;
  notes: string;
  ratio: number;
  pinned: boolean;
  unit: string;
  revision: number;
  externalRef: string;
  status: LegacyFraudCheckBundleStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    cost: number,
    expiresAt: number,
    notes: string,
    ratio: number,
    pinned: boolean,
    unit: string,
    revision: number,
    externalRef: string,
    status: LegacyFraudCheckBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.notes = notes;
    this.ratio = ratio;
    this.pinned = pinned;
    this.unit = unit;
    this.revision = revision;
    this.externalRef = externalRef;
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

  canMoveTo(next: LegacyFraudCheckBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyFraudCheckBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy fraud check bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedExposure(): number {
    return Math.round(this.expiresAt * this.cost * 100) / 100;
  }

  copy(): LegacyFraudCheckBundle {
    return new LegacyFraudCheckBundle(
      this.code,
      this.title,
      this.locale,
      this.cost,
      this.expiresAt,
      this.notes,
      this.ratio,
      this.pinned,
      this.unit,
      this.revision,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy fraud check bundle in status draft. */
export function newLegacyFraudCheckBundle(code: string, title: string): LegacyFraudCheckBundle {
  return new LegacyFraudCheckBundle(code, title, "", 0, 0, "", 0, false, "", 0, "", "draft");
}
