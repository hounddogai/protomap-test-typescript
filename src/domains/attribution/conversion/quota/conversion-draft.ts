import * as text from "../../../../kit/text.js";

/** Where a conversion draft is in its life cycle. */
export type ConversionDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a conversion draft and its current status. */
export class ConversionDraft {
  code: string;
  label: string;
  clicks: number;
  description: string;
  contactEmail: string;
  margin: number;
  budget: number;
  channel: string;
  threshold: number;
  externalRef: string;
  maximum: number;
  status: ConversionDraftStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    description: string,
    contactEmail: string,
    margin: number,
    budget: number,
    channel: string,
    threshold: number,
    externalRef: string,
    maximum: number,
    status: ConversionDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.description = description;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.budget = budget;
    this.channel = channel;
    this.threshold = threshold;
    this.externalRef = externalRef;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ConversionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"conversion draft"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget + this.maximum) * 100) / 100;
  }

  copy(): ConversionDraft {
    return new ConversionDraft(
      this.code,
      this.label,
      this.clicks,
      this.description,
      this.contactEmail,
      this.margin,
      this.budget,
      this.channel,
      this.threshold,
      this.externalRef,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a conversion draft in status requested. */
export function newConversionDraft(code: string, label: string): ConversionDraft {
  return new ConversionDraft(code, label, 0, "", "", 0, 0, "", 0, "", 0, "requested");
}
