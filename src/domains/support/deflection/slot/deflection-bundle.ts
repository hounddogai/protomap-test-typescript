import * as text from "../../../../kit/text.js";

/** Where a deflection bundle is in its life cycle. */
export type DeflectionBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a deflection bundle and its current status. */
export class DeflectionBundle {
  code: string;
  title: string;
  journeyId: string;
  label: string;
  contactEmail: string;
  batchSize: number;
  updatedAt: number;
  utmSource: string;
  impressions: number;
  unit: string;
  status: DeflectionBundleStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    label: string,
    contactEmail: string,
    batchSize: number,
    updatedAt: number,
    utmSource: string,
    impressions: number,
    unit: string,
    status: DeflectionBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.label = label;
    this.contactEmail = contactEmail;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.utmSource = utmSource;
    this.impressions = impressions;
    this.unit = unit;
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

  canMoveTo(next: DeflectionBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DeflectionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"deflection bundle"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.batchSize - this.impressions) * 100) / 100;
  }

  copy(): DeflectionBundle {
    return new DeflectionBundle(
      this.code,
      this.title,
      this.journeyId,
      this.label,
      this.contactEmail,
      this.batchSize,
      this.updatedAt,
      this.utmSource,
      this.impressions,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection bundle in status idle. */
export function newDeflectionBundle(code: string, title: string): DeflectionBundle {
  return new DeflectionBundle(code, title, "", "", "", 0, 0, "", 0, "", "idle");
}
