import * as text from "../../../../kit/text.js";

/** Where a legacy escalation exception is in its life cycle. */
export type LegacyEscalationExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy escalation exception. Its code is unique within a tenant. */
export class LegacyEscalationException {
  code: string;
  title: string;
  frequencyCap: number;
  approved: boolean;
  sequence: number;
  tags: string[];
  name: string;
  utmSource: string;
  capacity: number;
  clicks: number;
  status: LegacyEscalationExceptionStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    approved: boolean,
    sequence: number,
    tags: string[],
    name: string,
    utmSource: string,
    capacity: number,
    clicks: number,
    status: LegacyEscalationExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.sequence = sequence;
    this.tags = tags;
    this.name = name;
    this.utmSource = utmSource;
    this.capacity = capacity;
    this.clicks = clicks;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyEscalationExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyEscalationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy escalation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy escalation exception"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.frequencyCap * this.clicks * 100) / 100;
  }

  copy(): LegacyEscalationException {
    return new LegacyEscalationException(
      this.code,
      this.title,
      this.frequencyCap,
      this.approved,
      this.sequence,
      this.tags,
      this.name,
      this.utmSource,
      this.capacity,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy escalation exception in status proposed. */
export function newLegacyEscalationException(code: string, title: string): LegacyEscalationException {
  return new LegacyEscalationException(code, title, 0, false, 0, [], "", "", 0, 0, "proposed");
}
