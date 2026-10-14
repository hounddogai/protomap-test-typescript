import * as text from "../../../../kit/text.js";

/** Where a activation mapping is in its life cycle. */
export type ActivationMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A activation mapping. Its code is unique within a tenant. */
export class ActivationMapping {
  code: string;
  label: string;
  sendAt: number;
  reviewer: string;
  priority: number;
  limit: number;
  durationMinutes: number;
  title: string;
  status: ActivationMappingStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    reviewer: string,
    priority: number,
    limit: number,
    durationMinutes: number,
    title: string,
    status: ActivationMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.reviewer = reviewer;
    this.priority = priority;
    this.limit = limit;
    this.durationMinutes = durationMinutes;
    this.title = title;
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

  canMoveTo(next: ActivationMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ActivationMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.priority - this.limit) * 100) / 100;
  }

  copy(): ActivationMapping {
    return new ActivationMapping(
      this.code,
      this.label,
      this.sendAt,
      this.reviewer,
      this.priority,
      this.limit,
      this.durationMinutes,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a activation mapping in status planned. */
export function newActivationMapping(code: string, label: string): ActivationMapping {
  return new ActivationMapping(code, label, 0, "", 0, 0, 0, "", "planned");
}
