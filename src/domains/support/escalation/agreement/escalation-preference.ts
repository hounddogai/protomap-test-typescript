import * as text from "../../../../kit/text.js";

/** Where a escalation preference is in its life cycle. */
export type EscalationPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A escalation preference as the escalation team keeps it. */
export class EscalationPreference {
  code: string;
  label: string;
  description: string;
  currency: string;
  ratio: number;
  expiresAt: number;
  archived: boolean;
  pinned: boolean;
  cohort: string;
  status: EscalationPreferenceStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    currency: string,
    ratio: number,
    expiresAt: number,
    archived: boolean,
    pinned: boolean,
    cohort: string,
    status: EscalationPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.currency = currency;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.pinned = pinned;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.ratio + this.expiresAt) * 100) / 100;
  }

  copy(): EscalationPreference {
    return new EscalationPreference(
      this.code,
      this.label,
      this.description,
      this.currency,
      this.ratio,
      this.expiresAt,
      this.archived,
      this.pinned,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a escalation preference in status planned. */
export function newEscalationPreference(code: string, label: string): EscalationPreference {
  return new EscalationPreference(code, label, "", "", 0, 0, false, false, "", "planned");
}
