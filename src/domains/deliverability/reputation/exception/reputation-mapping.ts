import * as text from "../../../../kit/text.js";

/** Where a reputation mapping is in its life cycle. */
export type ReputationMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reputation mapping as the reputation team keeps it. */
export class ReputationMapping {
  code: string;
  name: string;
  graceDays: number;
  threshold: number;
  locale: string;
  contactEmail: string;
  archived: boolean;
  status: ReputationMappingStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    threshold: number,
    locale: string,
    contactEmail: string,
    archived: boolean,
    status: ReputationMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.threshold = threshold;
    this.locale = locale;
    this.contactEmail = contactEmail;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.threshold + this.graceDays) * 100) / 100;
  }

  copy(): ReputationMapping {
    return new ReputationMapping(
      this.code,
      this.name,
      this.graceDays,
      this.threshold,
      this.locale,
      this.contactEmail,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reputation mapping in status proposed. */
export function newReputationMapping(code: string, name: string): ReputationMapping {
  return new ReputationMapping(code, name, 0, 0, "", "", false, "proposed");
}
