/**
 * The enrollment entry records of journeys's enrollment work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a enrollment entry is in its life cycle. */
export type EnrollmentEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A enrollment entry. Its code is unique within a tenant. */
export class EnrollmentEntry {
  code: string;
  name: string;
  capacity: number;
  contactEmail: string;
  externalRef: string;
  revision: number;
  visible: boolean;
  label: string;
  status: EnrollmentEntryStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    contactEmail: string,
    externalRef: string,
    revision: number,
    visible: boolean,
    label: string,
    status: EnrollmentEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.externalRef = externalRef;
    this.revision = revision;
    this.visible = visible;
    this.label = label;
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

  canMoveTo(next: EnrollmentEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity - this.revision) * 100) / 100;
  }

  copy(): EnrollmentEntry {
    return new EnrollmentEntry(
      this.code,
      this.name,
      this.capacity,
      this.contactEmail,
      this.externalRef,
      this.revision,
      this.visible,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a enrollment entry in status idle. */
export function newEnrollmentEntry(code: string, name: string): EnrollmentEntry {
  return new EnrollmentEntry(code, name, 0, "", "", 0, false, "", "idle");
}
