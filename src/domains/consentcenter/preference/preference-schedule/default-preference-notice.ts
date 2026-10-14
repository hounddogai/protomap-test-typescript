import * as text from "../../../../kit/text.js";

/** Where a default preference notice is in its life cycle. */
export type DefaultPreferenceNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a default preference notice and its current status. */
export class DefaultPreferenceNotice {
  code: string;
  label: string;
  frequencyCap: number;
  segment: string;
  revision: number;
  contactEmail: string;
  floorValue: number;
  category: string;
  status: DefaultPreferenceNoticeStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    segment: string,
    revision: number,
    contactEmail: string,
    floorValue: number,
    category: string,
    status: DefaultPreferenceNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.floorValue = floorValue;
    this.category = category;
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

  canMoveTo(next: DefaultPreferenceNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
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

  moveTo(next: DefaultPreferenceNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default preference notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.frequencyCap * this.revision * 100) / 100;
  }

  copy(): DefaultPreferenceNotice {
    return new DefaultPreferenceNotice(
      this.code,
      this.label,
      this.frequencyCap,
      this.segment,
      this.revision,
      this.contactEmail,
      this.floorValue,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a default preference notice in status draft. */
export function newDefaultPreferenceNotice(code: string, label: string): DefaultPreferenceNotice {
  return new DefaultPreferenceNotice(code, label, 0, "", 0, "", 0, "", "draft");
}
