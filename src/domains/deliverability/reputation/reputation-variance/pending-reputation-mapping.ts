import * as text from "../../../../kit/text.js";

/** Where a pending reputation mapping is in its life cycle. */
export type PendingReputationMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending reputation mapping. Its code is unique within a tenant. */
export class PendingReputationMapping {
  code: string;
  title: string;
  archived: boolean;
  segment: string;
  attributes: Map<string, string>;
  reviewer: string;
  windowDays: number;
  phone: string;
  status: PendingReputationMappingStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    segment: string,
    attributes: Map<string, string>,
    reviewer: string,
    windowDays: number,
    phone: string,
    status: PendingReputationMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.segment = segment;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.phone = phone;
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

  canMoveTo(next: PendingReputationMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingReputationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): PendingReputationMapping {
    return new PendingReputationMapping(
      this.code,
      this.title,
      this.archived,
      this.segment,
      this.attributes,
      this.reviewer,
      this.windowDays,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a pending reputation mapping in status planned. */
export function newPendingReputationMapping(code: string, title: string): PendingReputationMapping {
  return new PendingReputationMapping(code, title, false, "", new Map<string, string>(), "", 0, "", "planned");
}
