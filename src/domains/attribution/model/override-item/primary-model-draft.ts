import * as text from "../../../../kit/text.js";

/** Where a primary model draft is in its life cycle. */
export type PrimaryModelDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary model draft and its current status. */
export class PrimaryModelDraft {
  code: string;
  title: string;
  segment: string;
  budget: number;
  margin: number;
  status: PrimaryModelDraftStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    budget: number,
    margin: number,
    status: PrimaryModelDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.budget = budget;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryModelDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryModelDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary model draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"primary model draft"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.margin + this.budget) * 100) / 100;
  }

  copy(): PrimaryModelDraft {
    return new PrimaryModelDraft(this.code, this.title, this.segment, this.budget, this.margin, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary model draft in status idle. */
export function newPrimaryModelDraft(code: string, title: string): PrimaryModelDraft {
  return new PrimaryModelDraft(code, title, "", 0, 0, "idle");
}
