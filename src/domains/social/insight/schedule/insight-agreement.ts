import * as text from "../../../../kit/text.js";

/** Where a insight agreement is in its life cycle. */
export type InsightAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One insight agreement, with what the planners need to act on it. */
export class InsightAgreement {
  code: string;
  label: string;
  checksum: string;
  impressions: number;
  externalRef: string;
  attributes: Map<string, string>;
  audienceId: string;
  status: InsightAgreementStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    impressions: number,
    externalRef: string,
    attributes: Map<string, string>,
    audienceId: string,
    status: InsightAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.impressions = impressions;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.audienceId = audienceId;
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

  canMoveTo(next: InsightAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): InsightAgreement {
    return new InsightAgreement(
      this.code,
      this.label,
      this.checksum,
      this.impressions,
      this.externalRef,
      this.attributes,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a insight agreement in status idle. */
export function newInsightAgreement(code: string, label: string): InsightAgreement {
  return new InsightAgreement(code, label, "", 0, "", new Map<string, string>(), "", "idle");
}
