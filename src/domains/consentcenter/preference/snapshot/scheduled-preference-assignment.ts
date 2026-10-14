import * as text from "../../../../kit/text.js";

/** Where a scheduled preference assignment is in its life cycle. */
export type ScheduledPreferenceAssignmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A scheduled preference assignment. Its code is unique within a tenant. */
export class ScheduledPreferenceAssignment {
  code: string;
  title: string;
  timezone: string;
  sequence: number;
  expiresAt: number;
  frequencyCap: number;
  sendAt: number;
  tags: string[];
  limit: number;
  priority: number;
  category: string;
  status: ScheduledPreferenceAssignmentStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    sequence: number,
    expiresAt: number,
    frequencyCap: number,
    sendAt: number,
    tags: string[],
    limit: number,
    priority: number,
    category: string,
    status: ScheduledPreferenceAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.sequence = sequence;
    this.expiresAt = expiresAt;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.tags = tags;
    this.limit = limit;
    this.priority = priority;
    this.category = category;
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

  canMoveTo(next: ScheduledPreferenceAssignmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ScheduledPreferenceAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled preference assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round(this.sendAt * this.priority * 100) / 100;
  }

  copy(): ScheduledPreferenceAssignment {
    return new ScheduledPreferenceAssignment(
      this.code,
      this.title,
      this.timezone,
      this.sequence,
      this.expiresAt,
      this.frequencyCap,
      this.sendAt,
      this.tags,
      this.limit,
      this.priority,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled preference assignment in status proposed. */
export function newScheduledPreferenceAssignment(code: string, title: string): ScheduledPreferenceAssignment {
  return new ScheduledPreferenceAssignment(code, title, "", 0, 0, 0, 0, [], 0, 0, "", "proposed");
}
