import * as text from "../../../../kit/text.js";

/** Where a manual streak agreement is in its life cycle. */
export type ManualStreakAgreementStatus = "created" | "validated" | "published" | "retired";

/** One manual streak agreement, with what the planners need to act on it. */
export class ManualStreakAgreement {
  code: string;
  title: string;
  version: number;
  threshold: number;
  campaignRef: string;
  maximum: number;
  attributes: Map<string, string>;
  minimum: number;
  retries: number;
  status: ManualStreakAgreementStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    threshold: number,
    campaignRef: string,
    maximum: number,
    attributes: Map<string, string>,
    minimum: number,
    retries: number,
    status: ManualStreakAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.attributes = attributes;
    this.minimum = minimum;
    this.retries = retries;
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

  canMoveTo(next: ManualStreakAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
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

  moveTo(next: ManualStreakAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual streak agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.retries + this.version) * 100) / 100;
  }

  copy(): ManualStreakAgreement {
    return new ManualStreakAgreement(
      this.code,
      this.title,
      this.version,
      this.threshold,
      this.campaignRef,
      this.maximum,
      this.attributes,
      this.minimum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual streak agreement in status created. */
export function newManualStreakAgreement(code: string, title: string): ManualStreakAgreement {
  return new ManualStreakAgreement(code, title, 0, 0, "", 0, new Map<string, string>(), 0, 0, "created");
}
