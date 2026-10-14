import * as text from "../../../../kit/text.js";

/** Where a domain draft is in its life cycle. */
export type DomainDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a domain draft and its current status. */
export class DomainDraft {
  code: string;
  label: string;
  priority: number;
  createdAt: number;
  capacity: number;
  checksum: string;
  region: string;
  status: DomainDraftStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    createdAt: number,
    capacity: number,
    checksum: string,
    region: string,
    status: DomainDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.createdAt = createdAt;
    this.capacity = capacity;
    this.checksum = checksum;
    this.region = region;
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

  canMoveTo(next: DomainDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DomainDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round((this.capacity - this.createdAt) * 100) / 100;
  }

  copy(): DomainDraft {
    return new DomainDraft(
      this.code,
      this.label,
      this.priority,
      this.createdAt,
      this.capacity,
      this.checksum,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a domain draft in status planned. */
export function newDomainDraft(code: string, label: string): DomainDraft {
  return new DomainDraft(code, label, 0, 0, 0, "", "", "planned");
}
