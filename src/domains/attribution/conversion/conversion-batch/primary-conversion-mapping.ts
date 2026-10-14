import * as text from "../../../../kit/text.js";

/** Where a primary conversion mapping is in its life cycle. */
export type PrimaryConversionMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A primary conversion mapping. Its code is unique within a tenant. */
export class PrimaryConversionMapping {
  code: string;
  label: string;
  notes: string;
  windowDays: number;
  locale: string;
  active: boolean;
  region: string;
  utmSource: string;
  reviewer: string;
  expiresAt: number;
  category: string;
  status: PrimaryConversionMappingStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    windowDays: number,
    locale: string,
    active: boolean,
    region: string,
    utmSource: string,
    reviewer: string,
    expiresAt: number,
    category: string,
    status: PrimaryConversionMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.windowDays = windowDays;
    this.locale = locale;
    this.active = active;
    this.region = region;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryConversionMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PrimaryConversionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary conversion mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round((this.windowDays + this.expiresAt) * 100) / 100;
  }

  copy(): PrimaryConversionMapping {
    return new PrimaryConversionMapping(
      this.code,
      this.label,
      this.notes,
      this.windowDays,
      this.locale,
      this.active,
      this.region,
      this.utmSource,
      this.reviewer,
      this.expiresAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary conversion mapping in status idle. */
export function newPrimaryConversionMapping(code: string, label: string): PrimaryConversionMapping {
  return new PrimaryConversionMapping(code, label, "", 0, "", false, "", "", "", 0, "", "idle");
}
