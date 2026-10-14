import * as text from "../../../../kit/text.js";

/** Where a rolling warmup template is in its life cycle. */
export type RollingWarmupTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling warmup template, with what the planners need to act on it. */
export class RollingWarmupTemplate {
  code: string;
  title: string;
  notes: string;
  archived: boolean;
  budget: number;
  contactEmail: string;
  score: number;
  status: RollingWarmupTemplateStatus;

  constructor(
    code: string,
    title: string,
    notes: string,
    archived: boolean,
    budget: number,
    contactEmail: string,
    score: number,
    status: RollingWarmupTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.notes = notes;
    this.archived = archived;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingWarmupTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWarmupTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling warmup template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.score + this.budget) * 100) / 100;
  }

  copy(): RollingWarmupTemplate {
    return new RollingWarmupTemplate(
      this.code,
      this.title,
      this.notes,
      this.archived,
      this.budget,
      this.contactEmail,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling warmup template in status draft. */
export function newRollingWarmupTemplate(code: string, title: string): RollingWarmupTemplate {
  return new RollingWarmupTemplate(code, title, "", false, 0, "", 0, "draft");
}
