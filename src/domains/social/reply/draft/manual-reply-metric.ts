import * as text from "../../../../kit/text.js";

/** Where a manual reply metric is in its life cycle. */
export type ManualReplyMetricStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A manual reply metric. Its code is unique within a tenant. */
export class ManualReplyMetric {
  code: string;
  label: string;
  name: string;
  contactEmail: string;
  graceDays: number;
  attributes: Map<string, string>;
  batchSize: number;
  audienceId: string;
  clicks: number;
  locale: string;
  margin: number;
  status: ManualReplyMetricStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    contactEmail: string,
    graceDays: number,
    attributes: Map<string, string>,
    batchSize: number,
    audienceId: string,
    clicks: number,
    locale: string,
    margin: number,
    status: ManualReplyMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.contactEmail = contactEmail;
    this.graceDays = graceDays;
    this.attributes = attributes;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.clicks = clicks;
    this.locale = locale;
    this.margin = margin;
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

  canMoveTo(next: ManualReplyMetricStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualReplyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reply metric ${this.code} cannot move from ${this.status} to ${next}`);
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

  adjustedValue(): number {
    return Math.round(this.graceDays * this.batchSize * 100) / 100;
  }

  copy(): ManualReplyMetric {
    return new ManualReplyMetric(
      this.code,
      this.label,
      this.name,
      this.contactEmail,
      this.graceDays,
      this.attributes,
      this.batchSize,
      this.audienceId,
      this.clicks,
      this.locale,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual reply metric in status open. */
export function newManualReplyMetric(code: string, label: string): ManualReplyMetric {
  return new ManualReplyMetric(code, label, "", "", 0, new Map<string, string>(), 0, "", 0, "", 0, "open");
}
