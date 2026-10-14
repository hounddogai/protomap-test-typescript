/**
 * The step group records of journeys's step work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a step group is in its life cycle. */
export type StepGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A step group as the step team keeps it. */
export class StepGroup {
  code: string;
  label: string;
  locale: string;
  weight: number;
  createdAt: number;
  channel: string;
  archived: boolean;
  frequencyCap: number;
  contactEmail: string;
  version: number;
  status: StepGroupStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    weight: number,
    createdAt: number,
    channel: string,
    archived: boolean,
    frequencyCap: number,
    contactEmail: string,
    version: number,
    status: StepGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.weight = weight;
    this.createdAt = createdAt;
    this.channel = channel;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.contactEmail = contactEmail;
    this.version = version;
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

  canMoveTo(next: StepGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StepGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"step group"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.frequencyCap + this.createdAt) * 100) / 100;
  }

  copy(): StepGroup {
    return new StepGroup(
      this.code,
      this.label,
      this.locale,
      this.weight,
      this.createdAt,
      this.channel,
      this.archived,
      this.frequencyCap,
      this.contactEmail,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a step group in status draft. */
export function newStepGroup(code: string, label: string): StepGroup {
  return new StepGroup(code, label, "", 0, 0, "", false, 0, "", 0, "draft");
}
