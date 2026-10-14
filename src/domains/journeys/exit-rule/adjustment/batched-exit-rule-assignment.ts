import * as text from "../../../../kit/text.js";

/** Where a batched exit rule assignment is in its life cycle. */
export type BatchedExitRuleAssignmentStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched exit rule assignment and its current status. */
export class BatchedExitRuleAssignment {
  code: string;
  title: string;
  budget: number;
  contactEmail: string;
  channel: string;
  cohort: string;
  journeyId: string;
  audienceId: string;
  attributes: Map<string, string>;
  status: BatchedExitRuleAssignmentStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    contactEmail: string,
    channel: string,
    cohort: string,
    journeyId: string,
    audienceId: string,
    attributes: Map<string, string>,
    status: BatchedExitRuleAssignmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.audienceId = audienceId;
    this.attributes = attributes;
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

  canMoveTo(next: BatchedExitRuleAssignmentStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
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

  moveTo(next: BatchedExitRuleAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched exit rule assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched exit rule assignment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): BatchedExitRuleAssignment {
    return new BatchedExitRuleAssignment(
      this.code,
      this.title,
      this.budget,
      this.contactEmail,
      this.channel,
      this.cohort,
      this.journeyId,
      this.audienceId,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched exit rule assignment in status idle. */
export function newBatchedExitRuleAssignment(code: string, title: string): BatchedExitRuleAssignment {
  return new BatchedExitRuleAssignment(code, title, 0, "", "", "", "", "", new Map<string, string>(), "idle");
}
