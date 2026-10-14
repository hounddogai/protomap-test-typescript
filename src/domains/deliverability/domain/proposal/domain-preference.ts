import * as text from "../../../../kit/text.js";

/** Where a domain preference is in its life cycle. */
export type DomainPreferenceStatus = "created" | "validated" | "published" | "retired";

/** The record of a domain preference and its current status. */
export class DomainPreference {
  code: string;
  label: string;
  cohort: string;
  source: string;
  campaignRef: string;
  quantity: number;
  status: DomainPreferenceStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    source: string,
    campaignRef: string,
    quantity: number,
    status: DomainPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.source = source;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DomainPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): DomainPreference {
    return new DomainPreference(
      this.code,
      this.label,
      this.cohort,
      this.source,
      this.campaignRef,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a domain preference in status created. */
export function newDomainPreference(code: string, label: string): DomainPreference {
  return new DomainPreference(code, label, "", "", "", 0, "created");
}
