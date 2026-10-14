/**
 * The rolling retention template records of growth's retention work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling retention template is in its life cycle. */
export type RollingRetentionTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One rolling retention template, with what the planners need to act on it. */
export class RollingRetentionTemplate {
  code: string;
  title: string;
  score: number;
  ownerId: string;
  archived: boolean;
  name: string;
  segment: string;
  status: RollingRetentionTemplateStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    ownerId: string,
    archived: boolean,
    name: string,
    segment: string,
    status: RollingRetentionTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.ownerId = ownerId;
    this.archived = archived;
    this.name = name;
    this.segment = segment;
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

  canMoveTo(next: RollingRetentionTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
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

  moveTo(next: RollingRetentionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling retention template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): RollingRetentionTemplate {
    return new RollingRetentionTemplate(
      this.code,
      this.title,
      this.score,
      this.ownerId,
      this.archived,
      this.name,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling retention template in status open. */
export function newRollingRetentionTemplate(code: string, title: string): RollingRetentionTemplate {
  return new RollingRetentionTemplate(code, title, 0, "", false, "", "", "open");
}
