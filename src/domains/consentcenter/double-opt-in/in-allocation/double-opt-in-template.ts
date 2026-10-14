import * as text from "../../../../kit/text.js";

/** Where a double opt in template is in its life cycle. */
export type DoubleOptInTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a double opt in template and its current status. */
export class DoubleOptInTemplate {
  code: string;
  title: string;
  batchSize: number;
  label: string;
  approved: boolean;
  attributes: Map<string, string>;
  startsAt: number;
  clicks: number;
  status: DoubleOptInTemplateStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    label: string,
    approved: boolean,
    attributes: Map<string, string>,
    startsAt: number,
    clicks: number,
    status: DoubleOptInTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.label = label;
    this.approved = approved;
    this.attributes = attributes;
    this.startsAt = startsAt;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"double opt in template"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.startsAt + this.batchSize) * 100) / 100;
  }

  copy(): DoubleOptInTemplate {
    return new DoubleOptInTemplate(
      this.code,
      this.title,
      this.batchSize,
      this.label,
      this.approved,
      this.attributes,
      this.startsAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a double opt in template in status new. */
export function newDoubleOptInTemplate(code: string, title: string): DoubleOptInTemplate {
  return new DoubleOptInTemplate(code, title, 0, "", false, new Map<string, string>(), 0, 0, "new");
}
