import * as text from "../../../../kit/text.js";

/** Where a mention allocation is in its life cycle. */
export type MentionAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A mention allocation as the mention team keeps it. */
export class MentionAllocation {
  code: string;
  name: string;
  utmSource: string;
  weight: number;
  sequence: number;
  phone: string;
  endsAt: number;
  status: MentionAllocationStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    weight: number,
    sequence: number,
    phone: string,
    endsAt: number,
    status: MentionAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.weight = weight;
    this.sequence = sequence;
    this.phone = phone;
    this.endsAt = endsAt;
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

  canMoveTo(next: MentionAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: MentionAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"mention allocation"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.weight + this.endsAt) * 100) / 100;
  }

  copy(): MentionAllocation {
    return new MentionAllocation(
      this.code,
      this.name,
      this.utmSource,
      this.weight,
      this.sequence,
      this.phone,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a mention allocation in status open. */
export function newMentionAllocation(code: string, name: string): MentionAllocation {
  return new MentionAllocation(code, name, "", 0, 0, "", 0, "open");
}
