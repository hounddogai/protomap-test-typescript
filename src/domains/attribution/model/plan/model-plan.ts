/**
 * The model plan records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model plan is in its life cycle. */
export type ModelPlanStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A model plan. Its code is unique within a tenant. */
export class ModelPlan {
  code: string;
  title: string;
  segment: string;
  budget: number;
  source: string;
  label: string;
  ownerId: string;
  openRate: number;
  visible: boolean;
  status: ModelPlanStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    budget: number,
    source: string,
    label: string,
    ownerId: string,
    openRate: number,
    visible: boolean,
    status: ModelPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.budget = budget;
    this.source = source;
    this.label = label;
    this.ownerId = ownerId;
    this.openRate = openRate;
    this.visible = visible;
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

  canMoveTo(next: ModelPlanStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ModelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.openRate + this.budget) * 100) / 100;
  }

  copy(): ModelPlan {
    return new ModelPlan(
      this.code,
      this.title,
      this.segment,
      this.budget,
      this.source,
      this.label,
      this.ownerId,
      this.openRate,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a model plan in status proposed. */
export function newModelPlan(code: string, title: string): ModelPlan {
  return new ModelPlan(code, title, "", 0, "", "", "", 0, false, "proposed");
}
