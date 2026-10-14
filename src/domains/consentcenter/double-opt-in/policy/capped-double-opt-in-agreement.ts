import * as text from "../../../../kit/text.js";

/** Where a capped double opt in agreement is in its life cycle. */
export type CappedDoubleOptInAgreementStatus = "created" | "validated" | "published" | "retired";

/** One capped double opt in agreement, with what the planners need to act on it. */
export class CappedDoubleOptInAgreement {
  code: string;
  title: string;
  revision: number;
  unit: string;
  attributes: Map<string, string>;
  campaignRef: string;
  status: CappedDoubleOptInAgreementStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    unit: string,
    attributes: Map<string, string>,
    campaignRef: string,
    status: CappedDoubleOptInAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.unit = unit;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: CappedDoubleOptInAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: CappedDoubleOptInAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped double opt in agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): CappedDoubleOptInAgreement {
    return new CappedDoubleOptInAgreement(
      this.code,
      this.title,
      this.revision,
      this.unit,
      this.attributes,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped double opt in agreement in status created. */
export function newCappedDoubleOptInAgreement(code: string, title: string): CappedDoubleOptInAgreement {
  return new CappedDoubleOptInAgreement(code, title, 0, "", new Map<string, string>(), "", "created");
}
