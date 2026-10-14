/**
 * The insight template records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight template is in its life cycle. */
export type InsightTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A insight template as the insight team keeps it. */
export class InsightTemplate {
  code: string;
  name: string;
  label: string;
  margin: number;
  segment: string;
  status: InsightTemplateStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    margin: number,
    segment: string,
    status: InsightTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.margin = margin;
    this.segment = segment;
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

  canMoveTo(next: InsightTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): InsightTemplate {
    return new InsightTemplate(this.code, this.name, this.label, this.margin, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a insight template in status proposed. */
export function newInsightTemplate(code: string, name: string): InsightTemplate {
  return new InsightTemplate(code, name, "", 0, "", "proposed");
}
