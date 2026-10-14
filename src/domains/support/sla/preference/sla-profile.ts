import * as text from "../../../../kit/text.js";

/** Where a sla profile is in its life cycle. */
export type SlaProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sla profile as the sla team keeps it. */
export class SlaProfile {
  code: string;
  name: string;
  budget: number;
  notes: string;
  updatedAt: number;
  quantity: number;
  tags: string[];
  sendAt: number;
  journeyId: string;
  threshold: number;
  attempts: number;
  status: SlaProfileStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    notes: string,
    updatedAt: number,
    quantity: number,
    tags: string[],
    sendAt: number,
    journeyId: string,
    threshold: number,
    attempts: number,
    status: SlaProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.quantity = quantity;
    this.tags = tags;
    this.sendAt = sendAt;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.attempts = attempts;
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

  canMoveTo(next: SlaProfileStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt + this.updatedAt) * 100) / 100;
  }

  copy(): SlaProfile {
    return new SlaProfile(
      this.code,
      this.name,
      this.budget,
      this.notes,
      this.updatedAt,
      this.quantity,
      this.tags,
      this.sendAt,
      this.journeyId,
      this.threshold,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a sla profile in status open. */
export function newSlaProfile(code: string, name: string): SlaProfile {
  return new SlaProfile(code, name, 0, "", 0, 0, [], 0, "", 0, 0, "open");
}
