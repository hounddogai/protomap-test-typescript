import * as text from "../../../../kit/text.js";

/** Where a lenient pacing template is in its life cycle. */
export type LenientPacingTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A lenient pacing template. Its code is unique within a tenant. */
export class LenientPacingTemplate {
  code: string;
  label: string;
  expiresAt: number;
  bid: number;
  revision: number;
  threshold: number;
  attributes: Map<string, string>;
  status: LenientPacingTemplateStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    bid: number,
    revision: number,
    threshold: number,
    attributes: Map<string, string>,
    status: LenientPacingTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.bid = bid;
    this.revision = revision;
    this.threshold = threshold;
    this.attributes = attributes;
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

  canMoveTo(next: LenientPacingTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LenientPacingTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient pacing template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.threshold + this.bid) * 100) / 100;
  }

  copy(): LenientPacingTemplate {
    return new LenientPacingTemplate(
      this.code,
      this.label,
      this.expiresAt,
      this.bid,
      this.revision,
      this.threshold,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient pacing template in status new. */
export function newLenientPacingTemplate(code: string, label: string): LenientPacingTemplate {
  return new LenientPacingTemplate(code, label, 0, 0, 0, 0, new Map<string, string>(), "new");
}
