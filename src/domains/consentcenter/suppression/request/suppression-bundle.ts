import * as text from "../../../../kit/text.js";

/** Where a suppression bundle is in its life cycle. */
export type SuppressionBundleStatus = "created" | "validated" | "published" | "retired";

/** The record of a suppression bundle and its current status. */
export class SuppressionBundle {
  code: string;
  name: string;
  timezone: string;
  rate: number;
  journeyId: string;
  contactEmail: string;
  status: SuppressionBundleStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    rate: number,
    journeyId: string,
    contactEmail: string,
    status: SuppressionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.rate = rate;
    this.journeyId = journeyId;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: SuppressionBundleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
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

  moveTo(next: SuppressionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): SuppressionBundle {
    return new SuppressionBundle(
      this.code,
      this.name,
      this.timezone,
      this.rate,
      this.journeyId,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a suppression bundle in status created. */
export function newSuppressionBundle(code: string, name: string): SuppressionBundle {
  return new SuppressionBundle(code, name, "", 0, "", "", "created");
}
