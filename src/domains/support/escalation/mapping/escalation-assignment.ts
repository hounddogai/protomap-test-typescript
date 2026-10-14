import * as text from "../../../../kit/text.js";

/** Where a escalation assignment is in its life cycle. */
export type EscalationAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A escalation assignment. Its code is unique within a tenant. */
export class EscalationAssignment {
  code: string;
  title: string;
  label: string;
  attributes: Map<string, string>;
  impressions: number;
  phone: string;
  endsAt: number;
  version: number;
  reviewer: string;
  status: EscalationAssignmentStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    attributes: Map<string, string>,
    impressions: number,
    phone: string,
    endsAt: number,
    version: number,
    reviewer: string,
    status: EscalationAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.attributes = attributes;
    this.impressions = impressions;
    this.phone = phone;
    this.endsAt = endsAt;
    this.version = version;
    this.reviewer = reviewer;
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

  canMoveTo(next: EscalationAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: EscalationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.version * this.impressions * 100) / 100;
  }

  copy(): EscalationAssignment {
    return new EscalationAssignment(
      this.code,
      this.title,
      this.label,
      this.attributes,
      this.impressions,
      this.phone,
      this.endsAt,
      this.version,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation assignment in status idle. */
export function newEscalationAssignment(code: string, title: string): EscalationAssignment {
  return new EscalationAssignment(code, title, "", new Map<string, string>(), 0, "", 0, 0, "", "idle");
}
