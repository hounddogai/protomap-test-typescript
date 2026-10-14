import * as text from "../../../../kit/text.js";

/** Where a pending creative template is in its life cycle. */
export type PendingCreativeTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending creative template. Its code is unique within a tenant. */
export class PendingCreativeTemplate {
  code: string;
  name: string;
  ceiling: number;
  capacity: number;
  journeyId: string;
  description: string;
  audienceId: string;
  archived: boolean;
  status: PendingCreativeTemplateStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    capacity: number,
    journeyId: string,
    description: string,
    audienceId: string,
    archived: boolean,
    status: PendingCreativeTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.description = description;
    this.audienceId = audienceId;
    this.archived = archived;
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

  canMoveTo(next: PendingCreativeTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: PendingCreativeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity - this.ceiling) * 100) / 100;
  }

  copy(): PendingCreativeTemplate {
    return new PendingCreativeTemplate(
      this.code,
      this.name,
      this.ceiling,
      this.capacity,
      this.journeyId,
      this.description,
      this.audienceId,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending creative template in status open. */
export function newPendingCreativeTemplate(code: string, name: string): PendingCreativeTemplate {
  return new PendingCreativeTemplate(code, name, 0, 0, "", "", "", false, "open");
}
