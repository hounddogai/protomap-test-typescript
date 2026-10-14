/**
 * The journey cycle records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey cycle is in its life cycle. */
export type JourneyCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a journey cycle and its current status. */
export class JourneyCycle {
  code: string;
  label: string;
  audienceId: string;
  description: string;
  approved: boolean;
  checksum: string;
  frequencyCap: number;
  active: boolean;
  maximum: number;
  status: JourneyCycleStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    description: string,
    approved: boolean,
    checksum: string,
    frequencyCap: number,
    active: boolean,
    maximum: number,
    status: JourneyCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.description = description;
    this.approved = approved;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.maximum = maximum;
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

  canMoveTo(next: JourneyCycleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: JourneyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"journey cycle"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.maximum * this.frequencyCap * 100) / 100;
  }

  copy(): JourneyCycle {
    return new JourneyCycle(
      this.code,
      this.label,
      this.audienceId,
      this.description,
      this.approved,
      this.checksum,
      this.frequencyCap,
      this.active,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a journey cycle in status open. */
export function newJourneyCycle(code: string, label: string): JourneyCycle {
  return new JourneyCycle(code, label, "", "", false, "", 0, false, 0, "open");
}
