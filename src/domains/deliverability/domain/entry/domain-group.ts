import * as text from "../../../../kit/text.js";

/** Where a domain group is in its life cycle. */
export type DomainGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A domain group as the domain team keeps it. */
export class DomainGroup {
  code: string;
  label: string;
  expiresAt: number;
  cohort: string;
  currency: string;
  notes: string;
  sequence: number;
  title: string;
  status: DomainGroupStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    cohort: string,
    currency: string,
    notes: string,
    sequence: number,
    title: string,
    status: DomainGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
    this.currency = currency;
    this.notes = notes;
    this.sequence = sequence;
    this.title = title;
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

  canMoveTo(next: DomainGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: DomainGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.sequence - this.expiresAt) * 100) / 100;
  }

  copy(): DomainGroup {
    return new DomainGroup(
      this.code,
      this.label,
      this.expiresAt,
      this.cohort,
      this.currency,
      this.notes,
      this.sequence,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a domain group in status planned. */
export function newDomainGroup(code: string, label: string): DomainGroup {
  return new DomainGroup(code, label, 0, "", "", "", 0, "", "planned");
}
