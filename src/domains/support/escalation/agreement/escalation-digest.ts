import * as text from "../../../../kit/text.js";

/** Where a escalation digest is in its life cycle. */
export type EscalationDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a escalation digest and its current status. */
export class EscalationDigest {
  code: string;
  label: string;
  revision: number;
  attributes: Map<string, string>;
  contactEmail: string;
  margin: number;
  source: string;
  attempts: number;
  frequencyCap: number;
  notes: string;
  journeyId: string;
  status: EscalationDigestStatus;

  constructor(
    code: string,
    label: string,
    revision: number,
    attributes: Map<string, string>,
    contactEmail: string,
    margin: number,
    source: string,
    attempts: number,
    frequencyCap: number,
    notes: string,
    journeyId: string,
    status: EscalationDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.revision = revision;
    this.attributes = attributes;
    this.contactEmail = contactEmail;
    this.margin = margin;
    this.source = source;
    this.attempts = attempts;
    this.frequencyCap = frequencyCap;
    this.notes = notes;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: EscalationDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EscalationDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"escalation digest"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round((this.margin - this.attempts) * 100) / 100;
  }

  copy(): EscalationDigest {
    return new EscalationDigest(
      this.code,
      this.label,
      this.revision,
      this.attributes,
      this.contactEmail,
      this.margin,
      this.source,
      this.attempts,
      this.frequencyCap,
      this.notes,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a escalation digest in status planned. */
export function newEscalationDigest(code: string, label: string): EscalationDigest {
  return new EscalationDigest(code, label, 0, new Map<string, string>(), "", 0, "", 0, 0, "", "", "planned");
}
